-- ---------------------------------------------------------------------------
-- Hand set chart numbers.
--
-- Most charts on the site are worked out from the rows the owner already
-- edits, and a few were fixed numbers written into the bundle. Neither can be
-- nudged from the panel: the first has no override at all, and the second
-- cannot be changed without a deploy.
--
-- This table holds one row per chart carrying the numbers the owner typed, as
-- a list of { name, values } objects. An empty list is what "not set yet"
-- looks like, which is also the signal for the chart to fall back to its
-- computed values rather than plot nothing. Clearing a chart is therefore a
-- delete, exactly like the project curve.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_chart_series (
  chart      text primary key check (chart ~ '^[a-z0-9-]{1,40}$'),
  rows       jsonb not null default '[]'::jsonb check (jsonb_typeof(rows) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.portfolio_chart_series enable row level security;

-- The numbers behind a chart carry nothing private, so the whole table is
-- readable. There is no visible flag and no draft stage: a chart is either
-- hand set or it is not.
drop policy if exists "chart series are public" on public.portfolio_chart_series;
create policy "chart series are public" on public.portfolio_chart_series
  for select to anon, authenticated
  using (true);

revoke all on public.portfolio_chart_series from anon, authenticated;
grant select on public.portfolio_chart_series to anon, authenticated;


-- ---------------------------------------------------------------------------
-- Saving one chart.
--
-- The whole series arrives in one call, because a chart is edited as a whole
-- and a partial update would leave the picture describing a mixture of two
-- intentions. An empty payload deletes the row, which is also how the owner
-- clears the override and gets the computed chart back.
--
-- Everything that lands in the column is rebuilt here rather than trusted: the
-- name is trimmed and capped, the keys are matched against a slug pattern, and
-- every value is forced to a finite number inside a sane range. A payload that
-- arrives from somewhere other than the panel therefore cannot store a shape
-- the pages are not written to read.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_save_chart_series(p_chart text, p_rows jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_chart  text := lower(public.portfolio_clean_text(p_chart));
  v_kept   jsonb := '[]'::jsonb;
  v_row    jsonb;
  v_name   text;
  v_values jsonb;
  v_key    text;
  v_text   text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_chart is null or v_chart !~ '^[a-z0-9-]{1,40}$' then
    raise exception 'A chart name is required';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'A list of chart rows is required';
  end if;

  if jsonb_array_length(p_rows) > 40 then
    raise exception 'That is more rows than one chart can show';
  end if;

  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    v_name := left(coalesce(public.portfolio_clean_text(v_row ->> 'name'), ''), 120);
    v_values := '{}'::jsonb;

    if jsonb_typeof(v_row -> 'values') = 'object' then
      for v_key in select jsonb_object_keys(v_row -> 'values')
      loop
        continue when v_key !~ '^[a-zA-Z0-9_]{1,32}$';

        -- Matched as text before the cast: a value that arrived as a boolean
        -- or an object would otherwise abort the whole save rather than be
        -- dropped, which is the opposite of rebuilding the payload.
        v_text := nullif(public.portfolio_clean_text((v_row -> 'values') ->> v_key), '');
        continue when v_text is null or v_text !~ '^-?[0-9]{1,9}(\.[0-9]{1,6})?$';

        v_values := v_values || jsonb_build_object(
          v_key,
          least(greatest(v_text::numeric, -1000000), 1000000)
        );
      end loop;
    end if;

    v_kept := v_kept || jsonb_build_object('name', v_name, 'values', v_values);
  end loop;

  if pg_column_size(v_kept) > 20000 then
    raise exception 'That is more text than one chart can hold';
  end if;

  if jsonb_array_length(v_kept) = 0 then
    delete from public.portfolio_chart_series where chart = v_chart;
  else
    insert into public.portfolio_chart_series (chart, rows, updated_by)
    values (v_chart, v_kept, v_email)
    on conflict (chart) do update
      set rows       = excluded.rows,
          updated_at = now(),
          updated_by = excluded.updated_by;
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_update', 'chart_' || v_chart,
          jsonb_array_length(v_kept) || ' row(s) set');

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_save_chart_series(text, jsonb) from public;
grant execute on function public.portfolio_save_chart_series(text, jsonb) to authenticated;

notify pgrst, 'reload schema';
