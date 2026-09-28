-- ---------------------------------------------------------------------------
-- Close the front door: only allowlisted administrators may hold an account.
--
--   * Supabase Auth ships with public signup enabled, so anyone who knows the
--     project URL could POST to /auth/v1/signup and mint an account. The panel
--     already treats a signed in non-admin as a visitor and signs it straight
--     back out, so such an account could not read or write anything. It could
--     still exist, count against the user quota, and sit there waiting for a
--     policy to be written wrong one day.
--
--   * The signup switch itself lives in the Auth settings, which SQL cannot
--     reach, and a setting can be flipped back by accident. A trigger on
--     auth.users is the part that cannot be forgotten: it refuses every
--     insert whose address is not already on the allowlist, no matter which
--     route asked for it. Both belts are meant to be worn.
--
--   * The allowlist is public.portfolio_admins, the same table the panel and
--     every RLS policy already consult, so there is one answer to "who is an
--     administrator" rather than a second copy that can drift.
--
--   * Adding an administrator therefore stays a two step job: insert the
--     address into portfolio_admins first, then create the account. An insert
--     that arrives before the allowlist row is refused, which is the safe
--     direction to fail in.
--
--   * A null address is refused too, so phone signup is closed as well.
-- ---------------------------------------------------------------------------

create or replace function public.prevent_unauthorized_signups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.portfolio_admins where lower(email) = lower(new.email)
  ) then
    raise exception 'Registrations are closed for public users.';
  end if;

  return new;
end;
$$;

-- The function only ever runs as a trigger. Nothing needs to call it through
-- the API, so it is not granted to anon or authenticated.
revoke execute on function public.prevent_unauthorized_signups() from public, anon, authenticated;

drop trigger if exists tr_prevent_unauthorized_signups on auth.users;

create trigger tr_prevent_unauthorized_signups
  before insert on auth.users
  for each row
  execute function public.prevent_unauthorized_signups();
