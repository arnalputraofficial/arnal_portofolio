-- The policies in 20260916000000 decide which rows an admin may touch, but a
-- policy alone grants nothing: without the privileges below the panel is
-- refused before the policy is ever consulted.
--
-- The visitor role is left out on purpose. Writes arrive through
-- portfolio_send_message, which is security definer, so anon never needs to
-- touch the table itself.
grant select, update, delete on public.portfolio_messages to authenticated;

notify pgrst, 'reload schema';