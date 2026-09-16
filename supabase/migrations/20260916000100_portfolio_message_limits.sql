-- A public write endpoint needs a ceiling. Without one, the messages table is
-- an open bucket that any script can fill.
create or replace function public.portfolio_send_message(
  p_name text,
  p_email text,
  p_topic text,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_name text;
  v_email text;
  v_topic text;
  v_message text;
  v_recent integer;
begin
  v_name := trim(coalesce(p_name, ''));
  v_email := lower(trim(coalesce(p_email, '')));
  v_topic := trim(coalesce(p_topic, 'General inquiry'));
  v_message := trim(coalesce(p_message, ''));

  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Name must be between 2 and 100 characters';
  end if;

  if length(v_email) < 5 or length(v_email) > 200 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email address';
  end if;

  if length(v_topic) > 120 then
    v_topic := left(v_topic, 120);
  end if;

  if length(v_message) < 20 or length(v_message) > 5000 then
    raise exception 'Message must be between 20 and 5000 characters';
  end if;

  select count(*) into v_recent
  from public.portfolio_messages
  where email = v_email and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    raise exception 'Too many messages from this address. Try again in an hour.';
  end if;

  select count(*) into v_recent
  from public.portfolio_messages
  where created_at > now() - interval '1 hour';

  if v_recent >= 60 then
    raise exception 'The contact form is busy right now. Try again later.';
  end if;

  insert into public.portfolio_messages (name, email, topic, message)
  values (v_name, v_email, v_topic, v_message)
  returning id into v_id;

  return v_id;
end;
$$;

-- Read state belongs to the panel, so the public function never returns it.
revoke all on function public.portfolio_send_message(text, text, text, text) from public;
grant execute on function public.portfolio_send_message(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';