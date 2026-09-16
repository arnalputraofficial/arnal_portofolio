-- Messages table for portfolio contact form submissions
create table if not exists public.portfolio_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.portfolio_messages enable row level security;

-- Only authenticated admins can view, update, or delete messages
create policy portfolio_messages_admin_select on public.portfolio_messages
  for select using (public.portfolio_is_admin());

create policy portfolio_messages_admin_update on public.portfolio_messages
  for update using (public.portfolio_is_admin());

create policy portfolio_messages_admin_delete on public.portfolio_messages
  for delete using (public.portfolio_is_admin());

-- Secure RPC to send/store message from public visitors
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
begin
  v_name := trim(coalesce(p_name, ''));
  v_email := trim(coalesce(p_email, ''));
  v_topic := trim(coalesce(p_topic, 'General'));
  v_message := trim(coalesce(p_message, ''));

  if length(v_name) < 2 or length(v_name) > 100 then
    raise exception 'Name must be between 2 and 100 characters';
  end if;

  if length(v_email) < 5 or length(v_email) > 200 or v_email not like '%@%.%' then
    raise exception 'Invalid email address';
  end if;

  if length(v_message) < 20 or length(v_message) > 5000 then
    raise exception 'Message must be between 20 and 5000 characters';
  end if;

  insert into public.portfolio_messages (name, email, topic, message)
  values (v_name, v_email, v_topic, v_message)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.portfolio_send_message(text, text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';