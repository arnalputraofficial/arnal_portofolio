-- ============================================================================
-- Portfolio entries: job experience, projects, certifications, skills.
--
-- Before this migration every portfolio entry lived as a TypeScript constant in
-- src/data/portfolio.ts, which meant adding a job or a certificate needed a code
-- change and a deploy. This file moves the source of truth into Postgres so the
-- owner can maintain it from the admin panel.
--
-- Design decisions worth knowing
--   Visibility     Each row carries a `visible` flag rather than a draft copy.
--                  An entry is written and takes effect immediately, and hiding
--                  one is a single toggle. Text keeps its draft and publish flow;
--                  entries do not, because shadow copying every column of every
--                  row would double the schema for very little gain.
--   Ordering       `sort_order` is rewritten wholesale when the owner reorders a
--                  list. Sending the full order rather than a "move row 3 up"
--                  instruction means the result does not depend on what the
--                  panel believed the previous order was.
--   Validation     Limits live in CHECK constraints so a bypassed browser cannot
--                  store a negative headcount. The evolving lists (project kind,
--                  certificate domain, skill category, role level) are checked
--                  against the functions in section 7 instead, so extending one
--                  is a single function change rather than a constraint rewrite.
--   Writes         Every mutation goes through a SECURITY DEFINER function that
--                  checks the caller's verified JWT email against
--                  portfolio_admins. No table accepts a direct insert from the
--                  API, not even from a signed in admin.
--   Privacy        portfolio_entries() lists its output columns one by one. A
--                  to_jsonb(row) shortcut would have shipped updated_by, the
--                  owner's email address, to every anonymous visitor.
--
-- Run once in the Supabase SQL Editor. It is idempotent.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Shared helpers
-- ---------------------------------------------------------------------------

-- Bumped by every write so a reader can tell whether its cached copy of the
-- entry lists is still current. One row, updated in place.
create table if not exists public.portfolio_data_version (
  id         boolean primary key default true check (id),
  version    bigint  not null default 1,
  updated_at timestamptz not null default now()
);

insert into public.portfolio_data_version (id, version)
values (true, 1)
on conflict (id) do nothing;

alter table public.portfolio_data_version enable row level security;

drop policy if exists "portfolio data version is public" on public.portfolio_data_version;
create policy "portfolio data version is public" on public.portfolio_data_version
  for select to anon, authenticated
  using (true);

grant select on public.portfolio_data_version to anon, authenticated;


create or replace function public.portfolio_bump_data_version()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.portfolio_data_version
     set version = version + 1,
         updated_at = now()
   where id;
$$;

revoke all on function public.portfolio_bump_data_version() from public;


-- Turns a text field into a trimmed value, or null when it is blank. Keeps
-- "not filled in" and "filled in with spaces" from becoming two different
-- states in the database.
create or replace function public.portfolio_clean_text(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select nullif(btrim(coalesce(p_value, '')), '');
$$;

revoke all on function public.portfolio_clean_text(text) from public;


-- Drops blank entries and trims the rest, so an empty text box in the panel
-- never turns into an empty string in a list.
create or replace function public.portfolio_clean_list(p_values text[])
returns text[]
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select coalesce(array_agg(cleaned order by idx), array[]::text[])
  from (
    select public.portfolio_clean_text(t.value) as cleaned, t.ord as idx
    from unnest(coalesce(p_values, array[]::text[])) with ordinality as t(value, ord)
  ) s
  where cleaned is not null;
$$;

revoke all on function public.portfolio_clean_list(text[]) from public;


-- Rejects a value that is not on the allowed list, and says what is allowed so
-- the message is actionable from the panel.
create or replace function public.portfolio_require_in_list(
  p_label   text,
  p_value   text,
  p_allowed text[]
)
returns text
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $$
begin
  if p_value is null or not (p_value = any (p_allowed)) then
    raise exception 'Unknown %: "%". Allowed values: %',
      p_label, coalesce(p_value, ''), array_to_string(p_allowed, ', ');
  end if;
  return p_value;
end;
$$;

revoke all on function public.portfolio_require_in_list(text, text, text[]) from public;


-- Reads a jsonb array of strings into a cleaned text[]. Kept as one function so
-- every entity treats a missing list and an empty list the same way.
create or replace function public.portfolio_payload_list(p_payload jsonb, p_key text)
returns text[]
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select case
    when p_payload ? p_key and jsonb_typeof(p_payload -> p_key) = 'array'
      then public.portfolio_clean_list(
             array(select jsonb_array_elements_text(p_payload -> p_key)))
    else null
  end;
$$;

revoke all on function public.portfolio_payload_list(jsonb, text) from public;


-- ---------------------------------------------------------------------------
-- 2. Job experience
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_career (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (length(btrim(title)) between 1 and 160),
  company     text not null check (length(btrim(company)) between 1 and 160),
  sector      text,
  location    text,
  -- Stored as yyyy-mm rather than a date: the owner knows the month, not the
  -- day, and a date column would invite a fabricated day of the month.
  start_month text not null check (start_month ~ '^\d{4}-\d{2}$'),
  end_month   text check (end_month is null or end_month ~ '^\d{4}-\d{2}$'),
  level       text not null default 'IC' check (level in ('IC', 'Lead', 'SPV', 'Manager')),
  headcount   integer not null default 0 check (headcount between 0 and 500),
  summary     text not null default '' check (length(summary) <= 2000),
  highlights  text[] not null default array[]::text[],
  stack       text[] not null default array[]::text[],
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create index if not exists portfolio_career_order_idx
  on public.portfolio_career (sort_order, start_month desc);

alter table public.portfolio_career enable row level security;

-- Readable by anyone, but only the rows the owner has left visible. A hidden
-- entry is invisible to the public API, not merely filtered by the browser.
drop policy if exists "published career is public" on public.portfolio_career;
create policy "published career is public" on public.portfolio_career
  for select to anon, authenticated
  using (visible or public.portfolio_is_admin());

grant select on public.portfolio_career to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 3. Projects
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) between 1 and 200),
  kind        text not null default 'Internal Systems',
  status      text not null default 'active'
                check (status in ('live', 'active', 'completed', 'on-hold')),
  role        text not null default '',
  year        integer not null check (year between 1980 and 2100),
  months      integer not null default 0 check (months between 0 and 600),
  team_size   integer not null default 0 check (team_size between 0 and 500),
  budget_m    numeric(12, 1) not null default 0 check (budget_m >= 0),
  impact      integer not null default 0 check (impact between 0 and 100),
  stack       text[] not null default array[]::text[],
  summary     text not null default '' check (length(summary) <= 4000),
  location    text,
  featured    boolean not null default false,
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create index if not exists portfolio_projects_order_idx
  on public.portfolio_projects (sort_order, year desc);

alter table public.portfolio_projects enable row level security;

drop policy if exists "published projects are public" on public.portfolio_projects;
create policy "published projects are public" on public.portfolio_projects
  for select to anon, authenticated
  using (visible or public.portfolio_is_admin());

grant select on public.portfolio_projects to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. Certifications
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_certifications (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(btrim(name)) between 1 and 200),
  issuer         text not null check (length(btrim(issuer)) between 1 and 160),
  domain         text not null default 'Cloud & Infra',
  issued_month   text check (issued_month is null or issued_month ~ '^\d{4}-\d{2}$'),
  -- null means the certificate does not expire at all, which is different from
  -- "expiry date not entered yet". The panel keeps those two states apart.
  expires_month  text check (expires_month is null or expires_month ~ '^\d{4}-\d{2}$'),
  credential_id  text,
  credential_url text check (credential_url is null or credential_url ~ '^https://'),
  status         text not null default 'active'
                   check (status in ('active', 'expired', 'renewing')),
  cost_m         numeric(10, 1) not null default 0 check (cost_m >= 0),
  visible        boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  updated_by     text
);

create index if not exists portfolio_certifications_order_idx
  on public.portfolio_certifications (sort_order, expires_month);

alter table public.portfolio_certifications enable row level security;

drop policy if exists "published certifications are public" on public.portfolio_certifications;
create policy "published certifications are public" on public.portfolio_certifications
  for select to anon, authenticated
  using (visible or public.portfolio_is_admin());

grant select on public.portfolio_certifications to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 5. Certificate images
--    Many images per certificate, in a defined order. Only the storage path is
--    recorded; the public URL is derived on the client from the project URL, so
--    nothing has to be rewritten if the bucket or project ever moves.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_certification_images (
  id               uuid primary key default gen_random_uuid(),
  certification_id uuid not null
                     references public.portfolio_certifications (id) on delete cascade,
  storage_path     text not null check (length(btrim(storage_path)) between 1 and 400),
  caption          text check (caption is null or length(caption) <= 300),
  width            integer check (width is null or width > 0),
  height           integer check (height is null or height > 0),
  byte_size        bigint check (byte_size is null or byte_size > 0),
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_by       text
);

create index if not exists portfolio_cert_images_parent_idx
  on public.portfolio_certification_images (certification_id, sort_order);

alter table public.portfolio_certification_images enable row level security;

-- An image is public exactly when its certificate is. Written as a subquery
-- against the parent rather than a plain `using (true)` so hiding a certificate
-- also hides its scans, without a second write.
drop policy if exists "published certificate images are public" on public.portfolio_certification_images;
create policy "published certificate images are public" on public.portfolio_certification_images
  for select to anon, authenticated
  using (
    public.portfolio_is_admin()
    or exists (
      select 1
      from public.portfolio_certifications c
      where c.id = certification_id and c.visible
    )
  );

grant select on public.portfolio_certification_images to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 6. Skills
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_skills (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) between 1 and 160),
  category   text not null default 'Engineering',
  level      integer not null default 50 check (level between 0 and 100),
  years      integer not null default 0 check (years between 0 and 60),
  last_used  integer not null default 2025 check (last_used between 1980 and 2100),
  -- Entry ids this skill is backed by. Free text on purpose: the evidence is a
  -- claim the owner makes, and the site renders it as a claim.
  evidence   text[] not null default array[]::text[],
  visible    boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

create index if not exists portfolio_skills_order_idx
  on public.portfolio_skills (sort_order, name);

alter table public.portfolio_skills enable row level security;

drop policy if exists "published skills are public" on public.portfolio_skills;
create policy "published skills are public" on public.portfolio_skills
  for select to anon, authenticated
  using (visible or public.portfolio_is_admin());

grant select on public.portfolio_skills to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 7. The evolving value lists
--    The panel fills its dropdowns from these functions rather than carrying a
--    second copy of the list in TypeScript. Extending one is a single change
--    here, with no code change and no deploy.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_project_kinds()
returns text[]
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select array[
    'Infrastructure', 'Internal Systems', 'Integration',
    'Security', 'Data & Monitoring', 'ERP Rollout'
  ];
$$;

create or replace function public.portfolio_certification_domains()
returns text[]
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select array[
    'Networking', 'Security', 'Cloud & Infra',
    'Service Management', 'Data', 'Project Management'
  ];
$$;

create or replace function public.portfolio_skill_categories()
returns text[]
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select array[
    'Leadership', 'Infrastructure', 'Engineering',
    'Security', 'Data', 'Operations'
  ];
$$;

create or replace function public.portfolio_role_levels()
returns text[]
language sql
immutable
set search_path = pg_catalog, pg_temp
as $$
  select array['IC', 'Lead', 'SPV', 'Manager'];
$$;

revoke all on function public.portfolio_project_kinds() from public;
revoke all on function public.portfolio_certification_domains() from public;
revoke all on function public.portfolio_skill_categories() from public;
revoke all on function public.portfolio_role_levels() from public;

grant execute on function public.portfolio_project_kinds() to anon, authenticated;
grant execute on function public.portfolio_certification_domains() to anon, authenticated;
grant execute on function public.portfolio_skill_categories() to anon, authenticated;
grant execute on function public.portfolio_role_levels() to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 8. Reading the whole set in one round trip
--    The site needs all four lists plus the images at once. Four separate selects
--    would mean four chances to render a half loaded page; one call means the
--    render either has everything or stays on the compiled defaults.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_entries()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'version', (select version from public.portfolio_data_version where id),

    'career', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'title', c.title, 'company', c.company,
               'sector', c.sector, 'location', c.location,
               'start', c.start_month, 'end', c.end_month,
               'level', c.level, 'headcount', c.headcount,
               'summary', c.summary, 'highlights', c.highlights, 'stack', c.stack,
               'visible', c.visible, 'sortOrder', c.sort_order
             ) order by c.sort_order, c.start_month desc, c.title)
      from public.portfolio_career c
      where c.visible or public.portfolio_is_admin()
    ), '[]'::jsonb),

    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'name', p.name, 'kind', p.kind, 'status', p.status,
               'role', p.role, 'year', p.year, 'months', p.months,
               'teamSize', p.team_size, 'budgetM', p.budget_m, 'impact', p.impact,
               'stack', p.stack, 'summary', p.summary, 'location', p.location,
               'featured', p.featured, 'visible', p.visible, 'sortOrder', p.sort_order
             ) order by p.sort_order, p.year desc, p.name)
      from public.portfolio_projects p
      where p.visible or public.portfolio_is_admin()
    ), '[]'::jsonb),

    'certifications', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'name', c.name, 'issuer', c.issuer,
               'domain', c.domain, 'issued', c.issued_month,
               'expires', c.expires_month, 'credentialId', c.credential_id,
               'credentialUrl', c.credential_url, 'status', c.status,
               'cost', c.cost_m, 'visible', c.visible, 'sortOrder', c.sort_order
             ) order by c.sort_order, c.name)
      from public.portfolio_certifications c
      where c.visible or public.portfolio_is_admin()
    ), '[]'::jsonb),

    'certificationImages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i.id, 'certificationId', i.certification_id,
               'storagePath', i.storage_path, 'caption', i.caption,
               'width', i.width, 'height', i.height, 'byteSize', i.byte_size,
               'sortOrder', i.sort_order
             ) order by i.sort_order, i.created_at)
      from public.portfolio_certification_images i
      where public.portfolio_is_admin()
         or exists (
              select 1 from public.portfolio_certifications c
              where c.id = i.certification_id and c.visible
            )
    ), '[]'::jsonb),

    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id, 'name', s.name, 'category', s.category,
               'level', s.level, 'years', s.years, 'lastUsed', s.last_used,
               'evidence', s.evidence, 'visible', s.visible, 'sortOrder', s.sort_order
             ) order by s.sort_order, s.name)
      from public.portfolio_skills s
      where s.visible or public.portfolio_is_admin()
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.portfolio_entries() from public;
grant execute on function public.portfolio_entries() to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 9. Writing one entry
--    One function per entity with an explicit column list, rather than a generic
--    "pass me some json" writer. More verbose, but an unknown key in the panel
--    payload becomes a loud error instead of a silent no-op.
--
--    A missing id means a new entry. sort_order is assigned here when it is not
--    supplied, so a new entry lands at the end of the list.
-- ---------------------------------------------------------------------------

create or replace function public.portfolio_save_career(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email   text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_new     boolean := public.portfolio_clean_text(p_payload ->> 'id') is null;
  v_id      uuid := nullif(p_payload ->> 'id', '')::uuid;
  v_title   text := public.portfolio_clean_text(p_payload ->> 'title');
  v_company text := public.portfolio_clean_text(p_payload ->> 'company');
  v_start   text := public.portfolio_clean_text(p_payload ->> 'startMonth');
  v_end     text := public.portfolio_clean_text(p_payload ->> 'endMonth');
  v_level   text := public.portfolio_require_in_list(
                      'role level',
                      coalesce(public.portfolio_clean_text(p_payload ->> 'level'), 'IC'),
                      public.portfolio_role_levels());
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_title is null then
    raise exception 'A job title is required';
  end if;

  if v_start is null then
    raise exception 'A start month is required, in yyyy-mm form';
  end if;

  if v_end is not null and v_end < v_start then
    raise exception 'The end month cannot come before the start month';
  end if;

  if v_new then
    if v_company is null then
      raise exception 'A company name is required';
    end if;

    insert into public.portfolio_career (
      title, company, sector, location, start_month, end_month, level,
      headcount, summary, highlights, stack, visible, sort_order, updated_by
    )
    values (
      v_title, v_company,
      public.portfolio_clean_text(p_payload ->> 'sector'),
      public.portfolio_clean_text(p_payload ->> 'location'),
      v_start, v_end, v_level,
      coalesce((p_payload ->> 'headcount')::integer, 0),
      coalesce(p_payload ->> 'summary', ''),
      coalesce(public.portfolio_payload_list(p_payload, 'highlights'), array[]::text[]),
      coalesce(public.portfolio_payload_list(p_payload, 'stack'), array[]::text[]),
      coalesce((p_payload ->> 'visible')::boolean, true),
      coalesce(
        (p_payload ->> 'sortOrder')::integer,
        (select coalesce(max(sort_order), 0) + 10 from public.portfolio_career)
      ),
      v_email
    )
    returning id into v_id;
  else
    update public.portfolio_career set
      title       = v_title,
      company     = coalesce(v_company, company),
      sector      = public.portfolio_clean_text(p_payload ->> 'sector'),
      location    = public.portfolio_clean_text(p_payload ->> 'location'),
      start_month = v_start,
      end_month   = v_end,
      level       = v_level,
      headcount   = coalesce((p_payload ->> 'headcount')::integer, headcount),
      summary     = coalesce(p_payload ->> 'summary', summary),
      highlights  = coalesce(public.portfolio_payload_list(p_payload, 'highlights'), highlights),
      stack       = coalesce(public.portfolio_payload_list(p_payload, 'stack'), stack),
      visible     = coalesce((p_payload ->> 'visible')::boolean, visible),
      sort_order  = coalesce((p_payload ->> 'sortOrder')::integer, sort_order),
      updated_at  = now(),
      updated_by  = v_email
    where id = v_id;

    if not found then
      raise exception 'That job entry no longer exists';
    end if;
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email,
          case when v_new then 'entry_create' else 'entry_update' end,
          'career:' || v_id,
          v_title || ' at ' || coalesce(v_company, 'an existing company'));

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_save_career(jsonb) from public;
grant execute on function public.portfolio_save_career(jsonb) to authenticated;


create or replace function public.portfolio_save_project(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_new   boolean := public.portfolio_clean_text(p_payload ->> 'id') is null;
  v_id    uuid := nullif(p_payload ->> 'id', '')::uuid;
  v_name  text := public.portfolio_clean_text(p_payload ->> 'name');
  v_kind  text := public.portfolio_require_in_list(
                    'project kind',
                    coalesce(public.portfolio_clean_text(p_payload ->> 'kind'), 'Internal Systems'),
                    public.portfolio_project_kinds());
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'A project name is required';
  end if;

  if v_new then
    insert into public.portfolio_projects (
      name, kind, status, role, year, months, team_size, budget_m, impact,
      stack, summary, location, featured, visible, sort_order, updated_by
    )
    values (
      v_name, v_kind,
      coalesce(public.portfolio_clean_text(p_payload ->> 'status'), 'active'),
      coalesce(p_payload ->> 'role', ''),
      coalesce((p_payload ->> 'year')::integer, extract(year from now())::integer),
      coalesce((p_payload ->> 'months')::integer, 0),
      coalesce((p_payload ->> 'teamSize')::integer, 0),
      coalesce((p_payload ->> 'budgetM')::numeric, 0),
      coalesce((p_payload ->> 'impact')::integer, 0),
      coalesce(public.portfolio_payload_list(p_payload, 'stack'), array[]::text[]),
      coalesce(p_payload ->> 'summary', ''),
      public.portfolio_clean_text(p_payload ->> 'location'),
      coalesce((p_payload ->> 'featured')::boolean, false),
      coalesce((p_payload ->> 'visible')::boolean, true),
      coalesce(
        (p_payload ->> 'sortOrder')::integer,
        (select coalesce(max(sort_order), 0) + 10 from public.portfolio_projects)
      ),
      v_email
    )
    returning id into v_id;
  else
    update public.portfolio_projects set
      name       = v_name,
      kind       = v_kind,
      status     = coalesce(public.portfolio_clean_text(p_payload ->> 'status'), status),
      role       = coalesce(p_payload ->> 'role', role),
      year       = coalesce((p_payload ->> 'year')::integer, year),
      months     = coalesce((p_payload ->> 'months')::integer, months),
      team_size  = coalesce((p_payload ->> 'teamSize')::integer, team_size),
      budget_m   = coalesce((p_payload ->> 'budgetM')::numeric, budget_m),
      impact     = coalesce((p_payload ->> 'impact')::integer, impact),
      stack      = coalesce(public.portfolio_payload_list(p_payload, 'stack'), stack),
      summary    = coalesce(p_payload ->> 'summary', summary),
      location   = public.portfolio_clean_text(p_payload ->> 'location'),
      featured   = coalesce((p_payload ->> 'featured')::boolean, featured),
      visible    = coalesce((p_payload ->> 'visible')::boolean, visible),
      sort_order = coalesce((p_payload ->> 'sortOrder')::integer, sort_order),
      updated_at = now(),
      updated_by = v_email
    where id = v_id;

    if not found then
      raise exception 'That project no longer exists';
    end if;
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email,
          case when v_new then 'entry_create' else 'entry_update' end,
          'project:' || v_id, v_name);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_save_project(jsonb) from public;
grant execute on function public.portfolio_save_project(jsonb) to authenticated;


create or replace function public.portfolio_save_certification(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_new    boolean := public.portfolio_clean_text(p_payload ->> 'id') is null;
  v_id     uuid := nullif(p_payload ->> 'id', '')::uuid;
  v_name   text := public.portfolio_clean_text(p_payload ->> 'name');
  v_issuer text := public.portfolio_clean_text(p_payload ->> 'issuer');
  v_domain text := public.portfolio_require_in_list(
                     'certificate domain',
                     coalesce(public.portfolio_clean_text(p_payload ->> 'domain'), 'Cloud & Infra'),
                     public.portfolio_certification_domains());
  v_issued text := public.portfolio_clean_text(p_payload ->> 'issuedMonth');
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'A certificate name is required';
  end if;

  if v_new and v_issuer is null then
    raise exception 'An issuing organisation is required';
  end if;

  if v_new then
    insert into public.portfolio_certifications (
      name, issuer, domain, issued_month, expires_month, credential_id,
      credential_url, status, cost_m, visible, sort_order, updated_by
    )
    values (
      v_name, v_issuer, v_domain,
      v_issued,
      public.portfolio_clean_text(p_payload ->> 'expiresMonth'),
      public.portfolio_clean_text(p_payload ->> 'credentialId'),
      public.portfolio_clean_text(p_payload ->> 'credentialUrl'),
      coalesce(public.portfolio_clean_text(p_payload ->> 'status'), 'active'),
      coalesce((p_payload ->> 'costM')::numeric, 0),
      coalesce((p_payload ->> 'visible')::boolean, true),
      coalesce(
        (p_payload ->> 'sortOrder')::integer,
        (select coalesce(max(sort_order), 0) + 10 from public.portfolio_certifications)
      ),
      v_email
    )
    returning id into v_id;
  else
    update public.portfolio_certifications set
      name           = v_name,
      issuer         = coalesce(v_issuer, issuer),
      domain         = v_domain,
      issued_month   = v_issued,
      expires_month  = public.portfolio_clean_text(p_payload ->> 'expiresMonth'),
      credential_id  = public.portfolio_clean_text(p_payload ->> 'credentialId'),
      credential_url = public.portfolio_clean_text(p_payload ->> 'credentialUrl'),
      status         = coalesce(public.portfolio_clean_text(p_payload ->> 'status'), status),
      cost_m         = coalesce((p_payload ->> 'costM')::numeric, cost_m),
      visible        = coalesce((p_payload ->> 'visible')::boolean, visible),
      sort_order     = coalesce((p_payload ->> 'sortOrder')::integer, sort_order),
      updated_at     = now(),
      updated_by     = v_email
    where id = v_id;

    if not found then
      raise exception 'That certificate no longer exists';
    end if;
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email,
          case when v_new then 'entry_create' else 'entry_update' end,
          'certification:' || v_id, v_name);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_save_certification(jsonb) from public;
grant execute on function public.portfolio_save_certification(jsonb) to authenticated;


create or replace function public.portfolio_save_skill(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email    text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_new      boolean := public.portfolio_clean_text(p_payload ->> 'id') is null;
  v_id       uuid := nullif(p_payload ->> 'id', '')::uuid;
  v_name     text := public.portfolio_clean_text(p_payload ->> 'name');
  v_category text := public.portfolio_require_in_list(
                       'skill category',
                       coalesce(public.portfolio_clean_text(p_payload ->> 'category'), 'Engineering'),
                       public.portfolio_skill_categories());
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'A skill name is required';
  end if;

  if v_new then
    insert into public.portfolio_skills (
      name, category, level, years, last_used, evidence, visible, sort_order, updated_by
    )
    values (
      v_name, v_category,
      coalesce((p_payload ->> 'level')::integer, 50),
      coalesce((p_payload ->> 'years')::integer, 0),
      coalesce((p_payload ->> 'lastUsed')::integer, extract(year from now())::integer),
      coalesce(public.portfolio_payload_list(p_payload, 'evidence'), array[]::text[]),
      coalesce((p_payload ->> 'visible')::boolean, true),
      coalesce(
        (p_payload ->> 'sortOrder')::integer,
        (select coalesce(max(sort_order), 0) + 10 from public.portfolio_skills)
      ),
      v_email
    )
    returning id into v_id;
  else
    update public.portfolio_skills set
      name       = v_name,
      category   = v_category,
      level      = coalesce((p_payload ->> 'level')::integer, level),
      years      = coalesce((p_payload ->> 'years')::integer, years),
      last_used  = coalesce((p_payload ->> 'lastUsed')::integer, last_used),
      evidence   = coalesce(public.portfolio_payload_list(p_payload, 'evidence'), evidence),
      visible    = coalesce((p_payload ->> 'visible')::boolean, visible),
      sort_order = coalesce((p_payload ->> 'sortOrder')::integer, sort_order),
      updated_at = now(),
      updated_by = v_email
    where id = v_id;

    if not found then
      raise exception 'That skill no longer exists';
    end if;
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email,
          case when v_new then 'entry_create' else 'entry_update' end,
          'skill:' || v_id, v_name);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_save_skill(jsonb) from public;
grant execute on function public.portfolio_save_skill(jsonb) to authenticated;


-- ---------------------------------------------------------------------------
-- 10. Visibility, on its own so the panel does not send a whole payload just to
--     hide one row.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_set_entry_visible(
  p_table   text,
  p_id      uuid,
  p_visible boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  -- The table name is checked against a fixed list. Interpolating an arbitrary
  -- name into dynamic SQL would be an injection hole, and this function is
  -- reachable by every authenticated session.
  if p_table not in ('career', 'projects', 'certifications', 'skills') then
    raise exception 'Unknown entry table: %', p_table;
  end if;

  execute format(
    'update public.portfolio_%I set visible = $1, updated_at = now(), updated_by = $2 where id = $3',
    p_table
  ) using p_visible, v_email, p_id;

  if not found then
    raise exception 'That entry no longer exists';
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_visibility', p_table || ':' || p_id,
          case when p_visible then 'shown on the site' else 'hidden from the site' end);

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_set_entry_visible(text, uuid, boolean) from public;
grant execute on function public.portfolio_set_entry_visible(text, uuid, boolean) to authenticated;


-- ---------------------------------------------------------------------------
-- 11. Deleting an entry
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_delete_entry(p_table text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_column text;
  v_label  text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if p_table not in ('career', 'projects', 'certifications', 'skills') then
    raise exception 'Unknown entry table: %', p_table;
  end if;

  -- Only the job history calls its label column title. Naming the column in a
  -- CASE rather than writing coalesce(title, name) matters: a reference to a
  -- column the table does not have is an error, not a null.
  v_column := case when p_table = 'career' then 'title' else 'name' end;

  execute format('select %s from public.portfolio_%I where id = $1', v_column, p_table)
    into v_label using p_id;

  if v_label is null then
    raise exception 'That entry no longer exists';
  end if;

  -- Certificate images go with the certificate through the foreign key cascade.
  -- The stored objects are removed by the panel, which knows their paths.
  execute format('delete from public.portfolio_%I where id = $1', p_table) using p_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_delete', p_table || ':' || p_id, v_label);

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_delete_entry(text, uuid) from public;
grant execute on function public.portfolio_delete_entry(text, uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 12. Reordering
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_reorder_entries(p_table text, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_count integer;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if p_table not in ('career', 'projects', 'certifications', 'skills') then
    raise exception 'Unknown entry table: %', p_table;
  end if;

  if p_ids is null or array_length(p_ids, 1) is null then
    raise exception 'An order is required';
  end if;

  execute format($fmt$
    update public.portfolio_%I t
       set sort_order = ordered.position,
           updated_at = now(),
           updated_by = $2
      from (
        select id, (ordinality * 10)::integer as position
        from unnest($1::uuid[]) with ordinality as u(id, ordinality)
      ) ordered
     where t.id = ordered.id
  $fmt$, p_table) using p_ids, v_email;

  get diagnostics v_count = row_count;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_reorder', p_table, v_count || ' row(s) reordered');

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_reorder_entries(text, uuid[]) from public;
grant execute on function public.portfolio_reorder_entries(text, uuid[]) to authenticated;


-- ---------------------------------------------------------------------------
-- 13. Certificate images: register, delete, reorder
--     The object is uploaded straight from the browser to Storage under the
--     admin policy already in place. This table only records where it went.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_add_certification_image(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_id     uuid;
  v_path   text := public.portfolio_clean_text(p_payload ->> 'storagePath');
  v_parent uuid := nullif(p_payload ->> 'certificationId', '')::uuid;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_path is null then
    raise exception 'A storage path is required';
  end if;

  if v_parent is null or not exists (
    select 1 from public.portfolio_certifications where id = v_parent
  ) then
    raise exception 'That certificate no longer exists';
  end if;

  insert into public.portfolio_certification_images (
    certification_id, storage_path, caption, width, height, byte_size, sort_order, updated_by
  )
  values (
    v_parent, v_path,
    public.portfolio_clean_text(p_payload ->> 'caption'),
    nullif(p_payload ->> 'width', '')::integer,
    nullif(p_payload ->> 'height', '')::integer,
    nullif(p_payload ->> 'byteSize', '')::bigint,
    coalesce(
      (p_payload ->> 'sortOrder')::integer,
      (select coalesce(max(sort_order), 0) + 10
         from public.portfolio_certification_images
        where certification_id = v_parent)
    ),
    v_email
  )
  returning id into v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'image_add', 'certification:' || v_parent, v_path);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_add_certification_image(jsonb) from public;
grant execute on function public.portfolio_add_certification_image(jsonb) to authenticated;


-- Removes the row and hands the storage path back, so the caller can delete the
-- object it owns. Splitting it this way keeps the database from pretending it
-- can reach into the storage layer.
create or replace function public.portfolio_delete_certification_image(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_path  text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  delete from public.portfolio_certification_images
   where id = p_id
  returning storage_path into v_path;

  if v_path is null then
    raise exception 'That image no longer exists';
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'image_delete', 'certification_image:' || p_id, v_path);

  perform public.portfolio_bump_data_version();
  return v_path;
end;
$$;

revoke all on function public.portfolio_delete_certification_image(uuid) from public;
grant execute on function public.portfolio_delete_certification_image(uuid) to authenticated;


create or replace function public.portfolio_reorder_certification_images(
  p_certification_id uuid,
  p_ids              uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  update public.portfolio_certification_images i
     set sort_order = ordered.position,
         updated_by = v_email
    from (
      select id, (ordinality * 10)::integer as position
      from unnest(coalesce(p_ids, array[]::uuid[])) with ordinality as u(id, ordinality)
    ) ordered
   where i.id = ordered.id
     and i.certification_id = p_certification_id;

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_reorder_certification_images(uuid, uuid[]) from public;
grant execute on function public.portfolio_reorder_certification_images(uuid, uuid[]) to authenticated;


-- ---------------------------------------------------------------------------
-- 14. Make the new functions visible to the API immediately
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
