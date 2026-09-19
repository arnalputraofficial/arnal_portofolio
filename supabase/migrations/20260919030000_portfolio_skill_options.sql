-- ---------------------------------------------------------------------------
-- Skills, three changes asked for by the owner.
--
--   * The category list was pinned inside portfolio_skill_categories() as a
--     literal array. Adding a category therefore meant a migration. It becomes
--     a small table the panel writes to, and the function keeps its name and
--     signature so every existing caller is untouched.
--
--   * Level was a number typed by hand on a 0-100 scale. It becomes a 1-5
--     self rating, where 5 is the strongest. The old values are converted
--     proportionally, and the 0-100 scale disappears from the database so no
--     two-digit number can be stored by accident.
--
--   * "Last used" becomes "Since": the year the skill was picked up, not the
--     year it was last touched. A date that only moves forward cannot describe
--     a skill held for years, and the honesty note on the page is reworded to
--     read from the earliest since instead.
--
-- Run once in the Supabase SQL Editor. It is idempotent.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Skill categories become data
--    The name is unique case-insensitively: "Data" and "data" are one category
--    as far as a reader is concerned, and two rows would let the panel offer
--    the same label twice.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_skill_category_options (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_by text
);

create unique index if not exists portfolio_skill_category_options_name_idx
  on public.portfolio_skill_category_options (lower(name));

-- The six categories the site shipped with, so an existing install keeps
-- exactly the list it had before this migration.
insert into public.portfolio_skill_category_options (name, sort_order)
values
  ('Leadership', 10),
  ('Infrastructure', 20),
  ('Engineering', 30),
  ('Security', 40),
  ('Data', 50),
  ('Operations', 60)
on conflict do nothing;

alter table public.portfolio_skill_category_options enable row level security;

-- A category name carries nothing private, and the public page needs the list
-- to render its tabs, so the whole table is readable.
drop policy if exists "skill categories are public" on public.portfolio_skill_category_options;
create policy "skill categories are public" on public.portfolio_skill_category_options
  for select to anon, authenticated
  using (true);

grant select on public.portfolio_skill_category_options to anon, authenticated;


-- The list function keeps its name and its `returns text[]` shape, so the
-- panel, the save function, and the public pages need no change beyond the
-- value they read. It stops being immutable: it now reads a table.
create or replace function public.portfolio_skill_categories()
returns text[]
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(name order by sort_order, name), array[]::text[])
  from public.portfolio_skill_category_options;
$$;

revoke all on function public.portfolio_skill_categories() from public;
grant execute on function public.portfolio_skill_categories() to anon, authenticated;


-- Adding one is the only write the panel needs. Deleting is deliberately not
-- offered: a category is a word other rows already point at, and a delete would
-- either strand those skills or silently rewrite them.
create or replace function public.portfolio_add_skill_category(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_name  text := public.portfolio_clean_text(p_name);
  v_id    uuid;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'A category name is required';
  end if;

  if length(v_name) > 80 then
    raise exception 'That category name is longer than 80 characters';
  end if;

  select id into v_id
    from public.portfolio_skill_category_options
   where lower(name) = lower(v_name);

  if v_id is not null then
    raise exception 'The category "%" is already on the list', v_name;
  end if;

  insert into public.portfolio_skill_category_options (name, sort_order, updated_by)
  values (
    v_name,
    (select coalesce(max(sort_order), 0) + 10 from public.portfolio_skill_category_options),
    v_email
  )
  returning id into v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_create', 'skill_category:' || v_id, v_name);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_add_skill_category(text) from public;
grant execute on function public.portfolio_add_skill_category(text) to authenticated;


-- ---------------------------------------------------------------------------
-- 2. Level becomes a 1-5 self rating
--    The conversion is proportional: 0-100 divided by twenty, rounded, and
--    clamped, so 80 becomes 4 and 100 becomes 5. Every stored value is rewritten
--    before the new constraint is added, because the old rows cannot satisfy it.
-- ---------------------------------------------------------------------------
alter table public.portfolio_skills
  drop constraint if exists portfolio_skills_level_check;

update public.portfolio_skills
   set level = greatest(1, least(5, round(level / 20.0)::integer));

alter table public.portfolio_skills
  alter column level set default 3;

alter table public.portfolio_skills
  add constraint portfolio_skills_level_check check (level between 1 and 5);


-- ---------------------------------------------------------------------------
-- 3. "Last used" becomes "Since"
--    The old column is converted rather than dropped: a skill held for six
--    years and last used in 2025 was picked up around 2019, which is the value
--    the owner is being asked for. The column is then removed so the two
--    meanings cannot be confused.
-- ---------------------------------------------------------------------------
alter table public.portfolio_skills
  add column if not exists since integer;

do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'portfolio_skills'
       and column_name = 'last_used'
  ) then
    update public.portfolio_skills
       set since = greatest(1980, least(2100, last_used - years))
     where since is null;

    alter table public.portfolio_skills drop column last_used;
  end if;
end;
$$;

update public.portfolio_skills
   set since = extract(year from now())::integer
 where since is null;

alter table public.portfolio_skills
  alter column since set default extract(year from now())::integer;

alter table public.portfolio_skills
  alter column since set not null;

alter table public.portfolio_skills
  drop constraint if exists portfolio_skills_since_check;

alter table public.portfolio_skills
  add constraint portfolio_skills_since_check check (since between 1980 and 2100);


-- ---------------------------------------------------------------------------
-- 4. Saving a skill speaks the new shape
--    Both fields are validated here as well as by the constraints, so a bad
--    value comes back as a sentence rather than as a constraint name.
-- ---------------------------------------------------------------------------
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
  v_level    integer := nullif(p_payload ->> 'level', '')::integer;
  v_since    integer := nullif(p_payload ->> 'since', '')::integer;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'A skill name is required';
  end if;

  if v_level is not null and v_level not between 1 and 5 then
    raise exception 'A skill level is a whole number from 1 to 5, where 5 is the strongest';
  end if;

  if v_since is not null and v_since not between 1980 and 2100 then
    raise exception 'The since year must be between 1980 and 2100';
  end if;

  if v_new then
    insert into public.portfolio_skills (
      name, category, level, years, since, evidence, visible, sort_order, updated_by
    )
    values (
      v_name, v_category,
      coalesce(v_level, 3),
      coalesce((p_payload ->> 'years')::integer, 0),
      coalesce(v_since, extract(year from now())::integer),
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
      level      = coalesce(v_level, level),
      years      = coalesce((p_payload ->> 'years')::integer, years),
      since      = coalesce(v_since, since),
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
-- 5. The snapshot carries the new field
--    Copied from the function as it stands in the database rather than from the
--    original migration, because the project gallery and the manual curve
--    landed in later files and those changes must survive.
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

    'projectImages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i.id, 'projectId', i.project_id,
               'storagePath', i.storage_path, 'caption', i.caption,
               'mimeType', i.mime_type,
               'width', i.width, 'height', i.height, 'byteSize', i.byte_size,
               'sortOrder', i.sort_order
             ) order by i.sort_order, i.created_at)
      from public.portfolio_project_images i
      where public.portfolio_is_admin()
         or exists (
              select 1 from public.portfolio_projects p
              where p.id = i.project_id and p.visible
            )
    ), '[]'::jsonb),

    'projectCurve', coalesce((
      select jsonb_agg(jsonb_build_object(
               'year', y.year, 'budgetM', y.budget_m, 'impact', y.impact
             ) order by y.year)
      from public.portfolio_project_curve y
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
               'mimeType', i.mime_type,
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
               'level', s.level, 'years', s.years, 'since', s.since,
               'evidence', s.evidence, 'visible', s.visible, 'sortOrder', s.sort_order
             ) order by s.sort_order, s.name)
      from public.portfolio_skills s
      where s.visible or public.portfolio_is_admin()
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.portfolio_entries() from public;
grant execute on function public.portfolio_entries() to anon, authenticated;


notify pgrst, 'reload schema';
