-- ============================================================================
-- Portfolio admin: content overrides, drafts, revisions, activity log, media.
--
-- Run this once in the Supabase SQL Editor of the portfolio project.
-- It is idempotent, so running it twice is safe.
--
-- Security model
--   The publishable key ships inside the browser bundle, so it is not a secret.
--   Everything that matters is enforced here instead:
--     * row level security is on for every table
--     * no table is reachable until a policy says so
--     * writes are only allowed through SECURITY DEFINER functions that check
--       the caller's verified JWT email against an allowlist
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Admin allowlist
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_admins (
  email    text primary key,
  note     text,
  added_at timestamptz not null default now()
);

-- The sign in form asks for a username, but Supabase Auth only understands
-- email addresses. The mapping from one to the other lives in the bundle
-- (src/lib/adminAccount.ts) rather than here: it is needed before a session
-- exists, and the mapped address is already printed on the contact page, so
-- storing it in the database would add a second copy without hiding anything.

-- Set for accounts still carrying the password they were created with. The
-- panel refuses to show anything else until the owner picks a new one, and the
-- flag is cleared by the definer function further down, not by the browser.
alter table public.portfolio_admins
  add column if not exists must_change_password boolean not null default true;

alter table public.portfolio_admins enable row level security;

-- Deliberately no policies. The table is invisible through the API; it is read
-- only by the definer functions below, which run as the table owner.


-- ---------------------------------------------------------------------------
-- 2. Is the caller an admin?
--    SECURITY DEFINER so it can read the allowlist, and STABLE so the planner
--    can cache it inside a single statement.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.portfolio_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.portfolio_is_admin() from public;
grant execute on function public.portfolio_is_admin() to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2b. Which admin account is calling?
--     Returns nothing at all for a visitor who is not on the allowlist, so the
--     panel can tell "not signed in" apart from "signed in but not an admin".
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_admin_state()
returns table (email text, must_change_password boolean)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not an admin account' using errcode = '42501';
  end if;

  return query
    select a.email, a.must_change_password
    from public.portfolio_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end;
$$;

revoke all on function public.portfolio_admin_state() from public;
grant execute on function public.portfolio_admin_state() to authenticated;


-- ---------------------------------------------------------------------------
-- 2c. The owner has picked a password of their own.
--     Only the account itself can clear its flag, and every other account on
--     the allowlist is left untouched.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_password_changed()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to update this account' using errcode = '42501';
  end if;

  update public.portfolio_admins a
     set must_change_password = false
   where lower(a.email) = lower(v_email);

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'password_change', null, 'admin password changed');
end;
$$;

revoke all on function public.portfolio_password_changed() from public;
grant execute on function public.portfolio_password_changed() to authenticated;


-- ---------------------------------------------------------------------------
-- 3. Published content overrides
--    A row exists only for keys the admin has published. Keys without a row
--    fall back to the defaults compiled into the site.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_content (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.portfolio_content enable row level security;

drop policy if exists "portfolio content is public" on public.portfolio_content;
create policy "portfolio content is public" on public.portfolio_content
  for select to anon, authenticated
  using (true);

drop policy if exists "portfolio admins write content" on public.portfolio_content;
create policy "portfolio admins write content" on public.portfolio_content
  for all to authenticated
  using (public.portfolio_is_admin())
  with check (public.portfolio_is_admin());

grant select on public.portfolio_content to anon, authenticated;
grant insert, update, delete on public.portfolio_content to authenticated;


-- ---------------------------------------------------------------------------
-- 4. Unpublished drafts
--    Separate table rather than a second column, because row level security
--    cannot hide a single column. Keeping drafts in their own table means a
--    visitor can never read work in progress.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_drafts (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.portfolio_drafts enable row level security;

drop policy if exists "portfolio admins read drafts" on public.portfolio_drafts;
create policy "portfolio admins read drafts" on public.portfolio_drafts
  for select to authenticated
  using (public.portfolio_is_admin());

drop policy if exists "portfolio admins write drafts" on public.portfolio_drafts;
create policy "portfolio admins write drafts" on public.portfolio_drafts
  for all to authenticated
  using (public.portfolio_is_admin())
  with check (public.portfolio_is_admin());

grant select, insert, update, delete on public.portfolio_drafts to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Revision history, so any publish can be rolled back
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_revisions (
  id         bigint generated always as identity primary key,
  key        text not null,
  value      text,
  action     text not null check (action in ('publish', 'revert')),
  actor      text not null,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_revisions_key_idx
  on public.portfolio_revisions (key, created_at desc);

alter table public.portfolio_revisions enable row level security;

-- Read only through the API. Rows are written by the definer functions below.
drop policy if exists "portfolio admins read revisions" on public.portfolio_revisions;
create policy "portfolio admins read revisions" on public.portfolio_revisions
  for select to authenticated
  using (public.portfolio_is_admin());

grant select on public.portfolio_revisions to authenticated;


-- ---------------------------------------------------------------------------
-- 6. Activity log
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_activity (
  id         bigint generated always as identity primary key,
  actor      text not null,
  action     text not null,
  target     text,
  detail     text,
  created_at timestamptz not null default now()
);

create index if not exists portfolio_activity_created_idx
  on public.portfolio_activity (created_at desc);

alter table public.portfolio_activity enable row level security;

drop policy if exists "portfolio admins read activity" on public.portfolio_activity;
create policy "portfolio admins read activity" on public.portfolio_activity
  for select to authenticated
  using (public.portfolio_is_admin());

grant select on public.portfolio_activity to authenticated;


-- ---------------------------------------------------------------------------
-- 7. Media records (profile photo)
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_media (
  id           text primary key,
  storage_path text not null,
  public_url   text not null,
  mime_type    text not null,
  byte_size    bigint not null check (byte_size > 0),
  width        integer,
  height       integer,
  updated_at   timestamptz not null default now(),
  updated_by   text
);

alter table public.portfolio_media enable row level security;

drop policy if exists "portfolio media is public" on public.portfolio_media;
create policy "portfolio media is public" on public.portfolio_media
  for select to anon, authenticated
  using (true);

drop policy if exists "portfolio admins write media" on public.portfolio_media;
create policy "portfolio admins write media" on public.portfolio_media
  for all to authenticated
  using (public.portfolio_is_admin())
  with check (public.portfolio_is_admin());

grant select on public.portfolio_media to anon, authenticated;
grant insert, update, delete on public.portfolio_media to authenticated;


-- ---------------------------------------------------------------------------
-- 8. Shared value validation
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_validate_value(p_key text, p_value text)
returns text
language plpgsql
immutable
-- Pin the path: the function only uses built-in text helpers, so it has no
-- reason to resolve names through whatever the caller set search_path to.
set search_path = pg_catalog, pg_temp
as $$
declare
  v_value text;
begin
  if p_key is null or length(btrim(p_key)) = 0 then
    raise exception 'A content key is required';
  end if;

  if length(p_key) > 200 then
    raise exception 'The content key is longer than 200 characters';
  end if;

  if p_value is null then
    raise exception 'A value is required for "%"', p_key;
  end if;

  -- Normalise line endings so what is stored matches what the editor sent.
  v_value := replace(p_value, chr(13) || chr(10), chr(10));

  -- Tab, newline, and carriage return are allowed. Every other control
  -- character is rejected, because they corrupt rendering and serve no purpose.
  if v_value ~ ('[' || chr(1) || '-' || chr(8) || chr(11) || chr(12)
                || chr(14) || '-' || chr(31) || chr(127) || ']') then
    raise exception 'The value for "%" contains control characters', p_key;
  end if;

  if length(btrim(v_value)) = 0 then
    raise exception 'The value for "%" cannot be empty', p_key;
  end if;

  if length(v_value) > 20000 then
    raise exception 'The value for "%" is % characters, the limit is 20000',
      p_key, length(v_value);
  end if;

  return v_value;
end;
$$;

revoke all on function public.portfolio_validate_value(text, text) from public;


-- ---------------------------------------------------------------------------
-- 9. Save one draft
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_save_draft(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_value text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio content' using errcode = '42501';
  end if;

  v_value := public.portfolio_validate_value(p_key, p_value);

  insert into public.portfolio_drafts (key, value, updated_at, updated_by)
  values (p_key, v_value, now(), v_email)
  on conflict (key) do update
    set value      = excluded.value,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.portfolio_save_draft(text, text) from public;
grant execute on function public.portfolio_save_draft(text, text) to authenticated;


-- ---------------------------------------------------------------------------
-- 10. Discard drafts. Pass null to discard everything.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_discard_draft(p_key text default null)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_count integer;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio content' using errcode = '42501';
  end if;

  if p_key is null then
    -- The WHERE clause is not decoration. Supabase preloads the safeupdate
    -- library for the authenticator role that PostgREST connects as, and that
    -- library rejects an unfiltered DELETE with error 21000. key is the primary
    -- key, so the condition is always true and the whole table is still cleared.
    delete from public.portfolio_drafts where key is not null;
  else
    delete from public.portfolio_drafts where key = p_key;
  end if;

  get diagnostics v_count = row_count;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'discard', p_key, v_count || ' draft(s) discarded');

  return v_count;
end;
$$;

revoke all on function public.portfolio_discard_draft(text) from public;
grant execute on function public.portfolio_discard_draft(text) to authenticated;


-- ---------------------------------------------------------------------------
-- 11. Publish drafts. Pass null to publish everything.
--     The previous value is copied into the revision table first, which is what
--     makes a rollback possible.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_publish(p_keys text[] default null)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_count integer := 0;
  r record;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to publish portfolio content' using errcode = '42501';
  end if;

  for r in
    select d.key, d.value
    from public.portfolio_drafts d
    where p_keys is null or d.key = any (p_keys)
    order by d.key
  loop
    insert into public.portfolio_revisions (key, value, action, actor)
    select c.key, c.value, 'publish', v_email
    from public.portfolio_content c
    where c.key = r.key;

    insert into public.portfolio_content (key, value, updated_at, updated_by)
    values (r.key, r.value, now(), v_email)
    on conflict (key) do update
      set value      = excluded.value,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by;

    delete from public.portfolio_drafts where key = r.key;

    v_count := v_count + 1;
  end loop;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'publish', null, v_count || ' key(s) published');

  return v_count;
end;
$$;

revoke all on function public.portfolio_publish(text[]) from public;
grant execute on function public.portfolio_publish(text[]) to authenticated;


-- ---------------------------------------------------------------------------
-- 12. Roll back one revision
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_revert(p_revision_id bigint)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_key text;
  v_value text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to revert portfolio content' using errcode = '42501';
  end if;

  select r.key, r.value into v_key, v_value
  from public.portfolio_revisions r
  where r.id = p_revision_id;

  if v_key is null then
    raise exception 'Revision % does not exist', p_revision_id;
  end if;

  -- Record the value being replaced, so the rollback is itself reversible.
  insert into public.portfolio_revisions (key, value, action, actor)
  select c.key, c.value, 'revert', v_email
  from public.portfolio_content c
  where c.key = v_key;

  if v_value is null then
    -- The revision captured a state with no override, so fall back to the
    -- default compiled into the site.
    delete from public.portfolio_content where key = v_key;
  else
    insert into public.portfolio_content (key, value, updated_at, updated_by)
    values (v_key, v_value, now(), v_email)
    on conflict (key) do update
      set value      = excluded.value,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by;
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'revert', v_key, 'restored revision ' || p_revision_id);

  return v_key;
end;
$$;

revoke all on function public.portfolio_revert(bigint) from public;
grant execute on function public.portfolio_revert(bigint) to authenticated;


-- ---------------------------------------------------------------------------
-- 13. Client side activity log, for events Postgres cannot see (sign in, etc.)
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_log(
  p_action text,
  p_target text default null,
  p_detail text default null
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
    raise exception 'Not authorised to write the activity log' using errcode = '42501';
  end if;

  if p_action is null or length(btrim(p_action)) = 0 or length(p_action) > 60 then
    raise exception 'Invalid activity action';
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, p_action, left(p_target, 200), left(p_detail, 500));
end;
$$;

revoke all on function public.portfolio_log(text, text, text) from public;
grant execute on function public.portfolio_log(text, text, text) to authenticated;


-- ---------------------------------------------------------------------------
-- 14. Log media changes with a trigger, so the log cannot be skipped
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_log_media()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.portfolio_activity (actor, action, target, detail)
  values (
    coalesce(auth.jwt() ->> 'email', 'unknown'),
    case tg_op
      when 'INSERT' then 'photo_upload'
      when 'UPDATE' then 'photo_replace'
      else 'photo_delete'
    end,
    coalesce(new.id, old.id),
    coalesce(new.storage_path, old.storage_path)
  );
  return null;
end;
$$;

drop trigger if exists portfolio_media_activity on public.portfolio_media;
create trigger portfolio_media_activity
  after insert or update or delete on public.portfolio_media
  for each row execute function public.portfolio_log_media();

-- A trigger function has no business being callable over the API. The trigger
-- itself still fires, because it runs as the table owner rather than the caller.
revoke all on function public.portfolio_log_media() from public;
revoke execute on function public.portfolio_log_media() from anon, authenticated;


-- ---------------------------------------------------------------------------
-- 15. Storage bucket for the profile photo
--     The size limit and MIME allowlist live here, so they hold even if the
--     browser is bypassed.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "portfolio media objects are public" on storage.objects;
create policy "portfolio media objects are public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio-media');

drop policy if exists "portfolio admins upload media objects" on storage.objects;
create policy "portfolio admins upload media objects" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-media' and public.portfolio_is_admin());

drop policy if exists "portfolio admins update media objects" on storage.objects;
create policy "portfolio admins update media objects" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and public.portfolio_is_admin())
  with check (bucket_id = 'portfolio-media' and public.portfolio_is_admin());

drop policy if exists "portfolio admins delete media objects" on storage.objects;
create policy "portfolio admins delete media objects" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-media' and public.portfolio_is_admin());


-- ---------------------------------------------------------------------------
-- 16. Seed the allowlist
--     Add every address that should be able to sign in to the admin panel.
--     An address that is not listed here is treated as a regular visitor even
--     if the matching auth user exists.
--
--     must_change_password is true on the seed row because the account starts
--     out with a shared placeholder password. The on conflict clause is left as
--     do nothing on purpose: re-running this file must never re-arm the flag on
--     an account whose owner has already chosen a password.
-- ---------------------------------------------------------------------------
insert into public.portfolio_admins (email, note, must_change_password)
values ('arnal@steadbyte.com', 'portfolio owner', true)
on conflict (email) do nothing;


-- ---------------------------------------------------------------------------
-- 17. Make the new tables visible to the API immediately
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
