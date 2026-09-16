-- ---------------------------------------------------------------------------
-- Capture a revision on every publish, including the first one for a key.
--
-- The first version of these functions copied the previous value with
--   insert into portfolio_revisions select ... from portfolio_content where key = r.key
-- which inserts zero rows when the key has never been overridden. The result
-- was that the very first publish of a key produced no revision row, so the
-- panel offered nothing to restore and the key could not be rolled back to the
-- default text compiled into the site.
--
-- portfolio_revert already knew how to handle a null value (drop the override
-- and fall back to the default), so the only fix needed is to always write one
-- revision row, with a null value when there is no previous override.
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
    -- Always one row. A null value means "there was no override", which revert
    -- reads as "delete the override and show the bundled default".
    insert into public.portfolio_revisions (key, value, action, actor)
    values (
      r.key,
      (select c.value from public.portfolio_content c where c.key = r.key),
      'publish',
      v_email
    );

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
  -- Written unconditionally for the same reason as in publish: a missing
  -- override is a state worth being able to return to.
  insert into public.portfolio_revisions (key, value, action, actor)
  values (
    v_key,
    (select c.value from public.portfolio_content c where c.key = v_key),
    'revert',
    v_email
  );

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
