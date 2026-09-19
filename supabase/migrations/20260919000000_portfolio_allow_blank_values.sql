-- ---------------------------------------------------------------------------
-- Let an admin blank a string on purpose.
--
-- The first version of this function rejected any value that was empty after
-- trimming. That was wrong twice over:
--
--   * The registry documents "leave empty" as the way to fall back to the
--     automatic behaviour for at least one key (home.stack.marquee), so the
--     state it promised could never be reached through the panel.
--   * Emptying a line is an ordinary edit. Because the editor saves every
--     unsaved field in one batch, the rejection was also the first error in
--     that batch, and the batch used to stop there: every field after the
--     blank one was dropped without being sent.
--
-- A null value is still refused. An empty string is a deliberate "show
-- nothing here", while null means the caller forgot to send a value at all.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_validate_value(p_key text, p_value text)
returns text
language plpgsql
immutable
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

  if length(v_value) > 20000 then
    raise exception 'The value for "%" is % characters, the limit is 20000',
      p_key, length(v_value);
  end if;

  return v_value;
end;
$$;

revoke all on function public.portfolio_validate_value(text, text) from public;
