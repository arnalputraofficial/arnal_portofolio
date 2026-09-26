-- ---------------------------------------------------------------------------
-- Status lists become data.
--
--   * The project status list was a literal array in the panel
--     (STATUS_OPTIONS) and a CHECK pinned to the same four values on
--     portfolio_projects.status. Adding a status meant a migration plus a
--     deploy. It becomes a small table the panel writes to, and the save
--     function validates against the table instead of the CHECK.
--
--   * The certificate list was pinned the same way, in the panel and in a
--     CHECK on portfolio_certifications.status.
--
--   * The two lists are separate on purpose. "on-hold" means nothing for a
--     certificate and "renewing" means nothing for a project, so one shared
--     list would offer each table values the reader would never see. A fixed
--     Scope column keeps them apart and keeps the panel's dropdown honest.
--
--   * Both CHECK constraints are dropped. Validation stays inside
--     portfolio_save_project and portfolio_save_certification via
--     portfolio_require_in_list against the table, which is where the role
--     level and skill category migrations already put it. A CHECK cannot
--     consult a table.
--
--   * Rename rewrites every row pointing at the old name, so no row is
--     stranded. Delete is refused while a row still uses the status, with a
--     count in the message so the panel can explain it.
--
-- Run once in the Supabase SQL Editor. It is idempotent.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Status options become data
--    The name is unique per scope, case-insensitively: "Active" and "active"
--    are one status as far as a reader is concerned, and two rows would let
--    the panel offer the same label twice.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_status_options (
  id         uuid primary key default gen_random_uuid(),
  scope      text not null check (scope in ('project', 'certification')),
  name       text not null check (length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_by text
);

create unique index if not exists portfolio_status_options_scope_name_idx
  on public.portfolio_status_options (scope, lower(name));

create index if not exists portfolio_status_options_scope_idx
  on public.portfolio_status_options (scope, sort_order);

-- The values both tables shipped with, so an existing install keeps exactly
-- the lists it had before this migration. Order matters: the first row of each
-- scope is what the panel falls back to when nothing else is chosen.
insert into public.portfolio_status_options (scope, name, sort_order)
values
  ('project',       'live',      10),
  ('project',       'active',    20),
  ('project',       'completed', 30),
  ('project',       'on-hold',   40),
  ('certification', 'active',    10),
  ('certification', 'expired',   20),
  ('certification', 'renewing',  30)
on conflict do nothing;

alter table public.portfolio_status_options enable row level security;

-- A status name carries nothing private, and the public pages need the list
-- to render their filters, so the whole table is readable. Writes go through
-- the definer functions below, so there is no insert or update policy.
drop policy if exists "status options are public" on public.portfolio_status_options;
create policy "status options are public" on public.portfolio_status_options
  for select to anon, authenticated
  using (true);

grant select on public.portfolio_status_options to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Read one scope's list
--    Kept as one function with a scope argument rather than two functions, so
--    a future third list costs a row, not a function.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_statuses(p_scope text)
returns text[]
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(o.name order by o.sort_order, o.created_at), array[]::text[])
  from public.portfolio_status_options o
  where o.scope = p_scope;
$$;

revoke all on function public.portfolio_statuses(text) from public;
grant execute on function public.portfolio_statuses(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 3. Add, rename, delete
--    Each refuses with a message the panel shows verbatim, and each returns
--    the new list for the scope so the panel never has to guess the order.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_add_status_option(
  p_scope text,
  p_name  text
)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_name  text := public.portfolio_clean_text(p_name);
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio options' using errcode = '42501';
  end if;

  if p_scope not in ('project', 'certification') then
    raise exception 'Unknown status list: "%"', coalesce(p_scope, '');
  end if;

  if v_name is null then
    raise exception 'A status name is required';
  end if;

  if length(v_name) > 80 then
    raise exception 'That status name is longer than 80 characters';
  end if;

  -- Lowercasing first keeps "Active" and "active" from both landing, which the
  -- unique index would otherwise refuse with a message the panel cannot read.
  if exists (
    select 1 from public.portfolio_status_options
    where scope = p_scope and lower(name) = lower(v_name)
  ) then
    raise exception '"%" is already on the % status list', v_name, p_scope;
  end if;

  insert into public.portfolio_status_options (scope, name, sort_order, updated_by)
  values (
    p_scope,
    v_name,
    (select coalesce(max(sort_order), 0) + 10 from public.portfolio_status_options where scope = p_scope),
    v_email
  );

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'option_create', 'status:' || p_scope || ':' || v_name, v_name);

  perform public.portfolio_bump_data_version();
  return public.portfolio_statuses(p_scope);
end;
$$;

revoke all on function public.portfolio_add_status_option(text, text) from public;
grant execute on function public.portfolio_add_status_option(text, text) to authenticated;


create or replace function public.portfolio_rename_status_option(
  p_scope text,
  p_from  text,
  p_to    text
)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_to    text := public.portfolio_clean_text(p_to);
  v_id    uuid;
  v_moved integer := 0;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio options' using errcode = '42501';
  end if;

  if v_to is null then
    raise exception 'A status name is required';
  end if;

  if length(v_to) > 80 then
    raise exception 'That status name is longer than 80 characters';
  end if;

  select id into v_id
  from public.portfolio_status_options
  where scope = p_scope and lower(name) = lower(p_from);

  if v_id is null then
    raise exception 'The % status "%" no longer exists', p_scope, coalesce(p_from, '');
  end if;

  if lower(v_to) <> lower(p_from) and exists (
    select 1 from public.portfolio_status_options
    where scope = p_scope and lower(name) = lower(v_to)
  ) then
    raise exception '"%" is already on the % status list', v_to, p_scope;
  end if;

  -- Every row pointing at the old name moves with it, so a rename can never
  -- leave a row holding a value the panel no longer offers.
  if p_scope = 'project' then
    update public.portfolio_projects
       set status = v_to, updated_at = now(), updated_by = v_email
     where lower(status) = lower(p_from);
    get diagnostics v_moved = row_count;
  else
    update public.portfolio_certifications
       set status = v_to, updated_at = now(), updated_by = v_email
     where lower(status) = lower(p_from);
    get diagnostics v_moved = row_count;
  end if;

  update public.portfolio_status_options
     set name = v_to, updated_at = now(), updated_by = v_email
   where id = v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'option_rename', 'status:' || p_scope || ':' || p_from,
          p_from || ' -> ' || v_to || ' (' || v_moved || ' rows)');

  perform public.portfolio_bump_data_version();
  return public.portfolio_statuses(p_scope);
end;
$$;

revoke all on function public.portfolio_rename_status_option(text, text, text) from public;
grant execute on function public.portfolio_rename_status_option(text, text, text) to authenticated;


create or replace function public.portfolio_delete_status_option(
  p_scope text,
  p_name  text
)
returns text[]
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_id    uuid;
  v_used  integer := 0;
  v_total integer := 0;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio options' using errcode = '42501';
  end if;

  select id into v_id
  from public.portfolio_status_options
  where scope = p_scope and lower(name) = lower(p_name);

  if v_id is null then
    raise exception 'The % status "%" no longer exists', p_scope, coalesce(p_name, '');
  end if;

  -- The list the panel offers and the list that is still in use have to
  -- overlap by at least one value, or the table would have no way to describe
  -- a row it already holds.
  select count(*) into v_total from public.portfolio_status_options where scope = p_scope;
  if v_total <= 1 then
    raise exception 'The % status list needs at least one value', p_scope;
  end if;

  if p_scope = 'project' then
    select count(*) into v_used from public.portfolio_projects
     where lower(status) = lower(p_name);
  else
    select count(*) into v_used from public.portfolio_certifications
     where lower(status) = lower(p_name);
  end if;

  if v_used > 0 then
    raise exception '"%" is still used by % row(s). Move them to another status first.',
      p_name, v_used;
  end if;

  delete from public.portfolio_status_options where id = v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'option_delete', 'status:' || p_scope || ':' || p_name, p_name);

  perform public.portfolio_bump_data_version();
  return public.portfolio_statuses(p_scope);
end;
$$;

revoke all on function public.portfolio_delete_status_option(text, text) from public;
grant execute on function public.portfolio_delete_status_option(text, text) to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Drop the pinned CHECK constraints
--    A CHECK cannot consult a table, so it has to go before a custom status
--    can be saved. The rule does not disappear: it moves into the save
--    functions below, which look the value up in the table above.
-- ---------------------------------------------------------------------------
alter table public.portfolio_projects
  drop constraint if exists portfolio_projects_status_check;

alter table public.portfolio_certifications
  drop constraint if exists portfolio_certifications_status_check;


-- ---------------------------------------------------------------------------
-- 5. Validate status inside the save functions
--    Only the two v_status lines and the two default literals change. Every
--    other column, coalesce, and guard is exactly as it was, so a save that
--    worked before this migration still writes the same values.
-- ---------------------------------------------------------------------------
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
  v_status text := public.portfolio_require_in_list(
                    'project status',
                    coalesce(public.portfolio_clean_text(p_payload ->> 'status'),
                             (select o.name from public.portfolio_status_options o
                               where o.scope = 'project'
                               order by o.sort_order, o.created_at limit 1)),
                    public.portfolio_statuses('project'));
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
      v_name, v_kind, v_status,
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

    insert into public.portfolio_activity (actor, action, target, detail)
    values (v_email, 'entry_create', 'project:' || v_id, v_name);
  else
    update public.portfolio_projects set
      name       = v_name,
      kind       = v_kind,
      status     = v_status,
      role       = coalesce(p_payload ->> 'role', role),
      year       = coalesce((p_payload ->> 'year')::integer, year),
      months     = coalesce((p_payload ->> 'months')::integer, months),
      team_size  = coalesce((p_payload ->> 'teamSize')::integer, team_size),
      budget_m   = coalesce((p_payload ->> 'budgetM')::numeric, budget_m),
      impact     = coalesce((p_payload ->> 'impact')::integer, impact),
      stack      = coalesce(public.portfolio_payload_list(p_payload, 'stack'), stack),
      summary    = coalesce(p_payload ->> 'summary', summary),
      location   = coalesce(public.portfolio_clean_text(p_payload ->> 'location'), location),
      featured   = coalesce((p_payload ->> 'featured')::boolean, featured),
      visible    = coalesce((p_payload ->> 'visible')::boolean, visible),
      sort_order = coalesce((p_payload ->> 'sortOrder')::integer, sort_order),
      updated_at = now(),
      updated_by = v_email
    where id = v_id;

    if not found then
      raise exception 'That project no longer exists';
    end if;

    insert into public.portfolio_activity (actor, action, target, detail)
    values (v_email, 'entry_update', 'project:' || v_id, v_name);
  end if;

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
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_new   boolean := public.portfolio_clean_text(p_payload ->> 'id') is null;
  v_id    uuid := nullif(p_payload ->> 'id', '')::uuid;
  v_name  text := public.portfolio_clean_text(p_payload ->> 'name');
  v_issuer text := public.portfolio_clean_text(p_payload ->> 'issuer');
  v_domain text := public.portfolio_require_in_list(
                     'certification domain',
                     coalesce(public.portfolio_clean_text(p_payload ->> 'domain'), 'Networking'),
                     public.portfolio_certification_domains());
  v_issued text := public.portfolio_clean_text(p_payload ->> 'issuedMonth');
  v_status text := public.portfolio_require_in_list(
                     'certification status',
                     coalesce(public.portfolio_clean_text(p_payload ->> 'status'),
                              (select o.name from public.portfolio_status_options o
                                where o.scope = 'certification'
                                order by o.sort_order, o.created_at limit 1)),
                     public.portfolio_statuses('certification'));
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
      v_status,
      coalesce((p_payload ->> 'costM')::numeric, 0),
      coalesce((p_payload ->> 'visible')::boolean, true),
      coalesce(
        (p_payload ->> 'sortOrder')::integer,
        (select coalesce(max(sort_order), 0) + 10 from public.portfolio_certifications)
      ),
      v_email
    )
    returning id into v_id;

    insert into public.portfolio_activity (actor, action, target, detail)
    values (v_email, 'entry_create', 'certification:' || v_id, v_name);
  else
    update public.portfolio_certifications set
      name           = v_name,
      issuer         = coalesce(v_issuer, issuer),
      domain         = v_domain,
      issued_month   = v_issued,
      expires_month  = public.portfolio_clean_text(p_payload ->> 'expiresMonth'),
      credential_id  = public.portfolio_clean_text(p_payload ->> 'credentialId'),
      credential_url = public.portfolio_clean_text(p_payload ->> 'credentialUrl'),
      status         = v_status,
      cost_m         = coalesce((p_payload ->> 'costM')::numeric, cost_m),
      visible        = coalesce((p_payload ->> 'visible')::boolean, visible),
      sort_order     = coalesce((p_payload ->> 'sortOrder')::integer, sort_order),
      updated_at     = now(),
      updated_by     = v_email
    where id = v_id;

    if not found then
      raise exception 'That certificate no longer exists';
    end if;

    insert into public.portfolio_activity (actor, action, target, detail)
    values (v_email, 'entry_update', 'certification:' || v_id, v_name);
  end if;

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_save_certification(jsonb) from public;
grant execute on function public.portfolio_save_certification(jsonb) to authenticated;


notify pgrst, 'reload schema';
