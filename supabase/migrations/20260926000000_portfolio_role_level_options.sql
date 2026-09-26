-- ---------------------------------------------------------------------------
-- Role levels become data.
--
--   * The level list was pinned inside portfolio_role_levels() as a literal
--     array. Adding a level therefore meant a migration. It becomes a small
--     table the panel writes to, and the function keeps its name and
--     signature so every existing caller is untouched.
--
--   * portfolio_career.level had a CHECK pinned to the same four values, so a
--     custom level would be rejected even after passing the save function.
--     The constraint is dropped; validation stays inside
--     portfolio_save_career via portfolio_require_in_list against the table.
--
--   * Rename rewrites both the option and every career row pointing at it, so
--     no row is stranded. Delete is refused while a career row still points
--     at the level, with a count in the message so the panel can explain it.
--
--   * The skill bar is a 1-10 self rating on the page but the column and the
--     save function still capped it at 1-5, so a value above 5 came back as
--     "A skill level is a whole number from 1 to 5". Both move to 1-10.
--
-- Run once in the Supabase SQL Editor. It is idempotent.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Role level options become data
--    The name is unique case-insensitively: "Lead" and "lead" are one level
--    as far as a reader is concerned, and two rows would let the panel offer
--    the same label twice.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_role_level_options (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_by text
);

create unique index if not exists portfolio_role_level_options_name_idx
  on public.portfolio_role_level_options (lower(name));

-- The four levels the site shipped with, so an existing install keeps
-- exactly the list it had before this migration.
insert into public.portfolio_role_level_options (name, sort_order)
values
  ('IC', 10),
  ('Lead', 20),
  ('SPV', 30),
  ('Manager', 40)
on conflict do nothing;

alter table public.portfolio_role_level_options enable row level security;

-- A level name carries nothing private, and the public page needs the list
-- to render its filter, so the whole table is readable.
drop policy if exists "role levels are public" on public.portfolio_role_level_options;
create policy "role levels are public" on public.portfolio_role_level_options
  for select to anon, authenticated
  using (true);

grant select on public.portfolio_role_level_options to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. The list function keeps its name and its `returns text[]` shape, so the
--    panel, the save function, and the public pages need no change beyond the
--    value they read. It stops being immutable: it now reads a table.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_role_levels()
returns text[]
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(array_agg(name order by sort_order, name), array[]::text[])
  from public.portfolio_role_level_options;
$$;

revoke all on function public.portfolio_role_levels() from public;
grant execute on function public.portfolio_role_levels() to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 3. The pinned CHECK goes away; the save function remains the validator.
-- ---------------------------------------------------------------------------
alter table public.portfolio_career
  drop constraint if exists portfolio_career_level_check;


-- ---------------------------------------------------------------------------
-- 4. Add one level. Mirrors portfolio_add_skill_category.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_add_role_level(p_name text)
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
    raise exception 'A level name is required';
  end if;

  if length(v_name) > 80 then
    raise exception 'That level name is longer than 80 characters';
  end if;

  select id into v_id
    from public.portfolio_role_level_options
   where lower(name) = lower(v_name);

  if v_id is not null then
    raise exception 'The level "%" is already on the list', v_name;
  end if;

  insert into public.portfolio_role_level_options (name, sort_order, updated_by)
  values (
    v_name,
    (select coalesce(max(sort_order), 0) + 10 from public.portfolio_role_level_options),
    v_email
  )
  returning id into v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_create', 'role_level:' || v_id, v_name);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_add_role_level(text) from public;
grant execute on function public.portfolio_add_role_level(text) to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Rename one level, rewriting every career row that points at it.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_rename_role_level(p_from text, p_to text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_from  text := public.portfolio_clean_text(p_from);
  v_to    text := public.portfolio_clean_text(p_to);
  v_id    uuid;
  v_moved integer := 0;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_from is null or v_to is null then
    raise exception 'Both the current level name and the new name are required';
  end if;

  if length(v_to) > 80 then
    raise exception 'That level name is longer than 80 characters';
  end if;

  select id into v_id
    from public.portfolio_role_level_options
   where lower(name) = lower(v_from);

  if v_id is null then
    raise exception 'The level "%" is not on the list', v_from;
  end if;

  if exists (
    select 1 from public.portfolio_role_level_options
     where lower(name) = lower(v_to) and id <> v_id
  ) then
    raise exception 'The level "%" is already on the list', v_to;
  end if;

  update public.portfolio_role_level_options
     set name = v_to, updated_by = v_email
   where id = v_id;

  update public.portfolio_career
     set level = v_to, updated_at = now(), updated_by = v_email
   where lower(level) = lower(v_from);
  get diagnostics v_moved = row_count;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_update', 'role_level:' || v_id, v_from || ' to ' || v_to || ' (' || v_moved || ' rows)');

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_rename_role_level(text, text) from public;
grant execute on function public.portfolio_rename_role_level(text, text) to authenticated;


-- ---------------------------------------------------------------------------
-- 6. Delete one level. Refused while a career row still uses it.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_delete_role_level(p_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_name  text := public.portfolio_clean_text(p_name);
  v_id    uuid;
  v_used  integer := 0;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_name is null then
    raise exception 'A level name is required';
  end if;

  select id into v_id
    from public.portfolio_role_level_options
   where lower(name) = lower(v_name);

  if v_id is null then
    raise exception 'The level "%" is not on the list', v_name;
  end if;

  select count(*) into v_used
    from public.portfolio_career
   where lower(level) = lower(v_name);

  if v_used > 0 then
    raise exception 'The level "%" is used by % job entries, so it cannot be deleted. Rename it or move those entries first.', v_name, v_used;
  end if;

  delete from public.portfolio_role_level_options where id = v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_delete', 'role_level:' || v_id, v_name);

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_delete_role_level(text) from public;
grant execute on function public.portfolio_delete_role_level(text) to authenticated;


-- ---------------------------------------------------------------------------
-- 3. The skill bar really is 1-10
--    The bar on the page has always offered ten steps, while the column and
--    the save function stopped at five, so any value above five was rejected
--    with a message that contradicted the page. Stored values are left as they
--    are: a four stays a four, it is simply no longer the ceiling.
-- ---------------------------------------------------------------------------
alter table public.portfolio_skills
  drop constraint if exists portfolio_skills_level_check;

alter table public.portfolio_skills
  add constraint portfolio_skills_level_check check (level between 1 and 10);

-- The guard inside the save function moves with the column. The body is the
-- one already in the database, with only the range and its sentence changed.
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

  if v_level is not null and v_level not between 1 and 10 then
    raise exception 'A skill level is a whole number from 1 to 10, where 10 is the strongest';
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


notify pgrst, 'reload schema';
