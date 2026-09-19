-- ---------------------------------------------------------------------------
-- Project photos, and a chart curve the owner sets by hand.
--
-- Two requests from the owner, both about the Projects page:
--
--   * Screenshots and photos belong on a project. Until now a project was text
--     only: a name, a summary, and four numbers. The work is visual, so each
--     project gains an ordered gallery with a caption per picture.
--
--   * The "Budget and impact per year" line was computed as the average impact
--     of whatever projects happened to be dated that year. That made the chart
--     a consequence of the table rather than a statement the owner makes. It
--     becomes a small table the owner edits directly, one row per year.
--
-- The gallery mirrors portfolio_certification_images: only the storage path is
-- recorded and the public URL is derived on the client, a row is public exactly
-- when its parent project is, and every write goes through a SECURITY DEFINER
-- function that checks the caller against portfolio_admins.
--
-- Unlike certificate scans the gallery is raster only. A certificate arrives as
-- a PDF, but a project screenshot is a picture, and allowing a document here
-- would make the detail dialog branch between an image and an embedded viewer
-- for no gain.
--
-- The curve falls back to the computed average when the table is empty, so an
-- untouched site renders exactly as it did before this migration.
--
-- Run once in the Supabase SQL Editor. It is idempotent.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
-- 1. Project photos
--    Same shape as the certificate gallery, including the MIME column: a
--    screenshot pasted from a phone or a chat app is routinely named
--    "image.jpg" whatever it really is, so the extension is not evidence.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_project_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null
                 references public.portfolio_projects (id) on delete cascade,
  storage_path text not null check (length(btrim(storage_path)) between 1 and 400),
  mime_type    text not null default 'image/jpeg'
                 check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  caption      text check (caption is null or length(caption) <= 300),
  width        integer check (width is null or width > 0),
  height       integer check (height is null or height > 0),
  byte_size    bigint check (byte_size is null or byte_size > 0),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_by   text
);

create index if not exists portfolio_project_images_parent_idx
  on public.portfolio_project_images (project_id, sort_order);

alter table public.portfolio_project_images enable row level security;

-- A photo is public exactly when its project is, written as a subquery against
-- the parent rather than `using (true)`, so hiding a project also hides its
-- gallery without a second write.
drop policy if exists "published project images are public" on public.portfolio_project_images;
create policy "published project images are public" on public.portfolio_project_images
  for select to anon, authenticated
  using (
    public.portfolio_is_admin()
    or exists (
      select 1 from public.portfolio_projects p
      where p.id = project_id and p.visible
    )
  );

grant select on public.portfolio_project_images to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. The chart curve, one row per year
--    The year is the primary key rather than a surrogate id: the chart plots
--    one point per year, so two rows for the same year is not a state worth
--    being able to represent. Saving is an upsert per year plus a delete of the
--    years that are no longer listed.
-- ---------------------------------------------------------------------------
create table if not exists public.portfolio_project_curve (
  year       integer primary key check (year between 1980 and 2100),
  budget_m   numeric(12, 1) not null default 0 check (budget_m >= 0),
  impact     integer not null default 0 check (impact between 0 and 100),
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.portfolio_project_curve enable row level security;

-- Chart totals carry nothing private, so the whole table is readable. There is
-- no visible flag: an empty table is what "not set yet" looks like, and that is
-- also the signal for the chart to fall back to its computed values.
drop policy if exists "project curve is public" on public.portfolio_project_curve;
create policy "project curve is public" on public.portfolio_project_curve
  for select to anon, authenticated
  using (true);

grant select on public.portfolio_project_curve to anon, authenticated;

notify pgrst, 'reload schema';


-- ---------------------------------------------------------------------------
-- The rest of this file was applied in two further migrations, recorded in the
-- database as 20260919020001_portfolio_project_entries and
-- 20260919020002_portfolio_project_writes. Both are the same text as below.
-- ---------------------------------------------------------------------------
-- 3. The snapshot carries both through to the pages
--    Copied from the function as it stands in the database rather than from the
--    original migration, because the certificate MIME column landed in a later
--    file and that change must survive.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_entries()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'version', (select version from public.portfolio_data_version where id),

    'career', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'title', c.title, 'company', c.company,
               'sector', c.sector, 'location', c.location,
               'start', c.start_month, 'end', c.end_month,
               'level', c.level, 'headcount', c.headcount,
               'summary', c.summary, 'highlights', c.highlights, 'stack', c.stack,
               'visible', c.visible, 'sortOrder', c.sort_order
             ) order by c.sort_order, c.start_month desc, c.title)
      from public.portfolio_career c
      where c.visible or public.portfolio_is_admin()
    ), '[]'::jsonb),

    'projects', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', p.id, 'name', p.name, 'kind', p.kind, 'status', p.status,
               'role', p.role, 'year', p.year, 'months', p.months,
               'teamSize', p.team_size, 'budgetM', p.budget_m, 'impact', p.impact,
               'stack', p.stack, 'summary', p.summary, 'location', p.location,
               'featured', p.featured, 'visible', p.visible, 'sortOrder', p.sort_order
             ) order by p.sort_order, p.year desc, p.name)
      from public.portfolio_projects p
      where p.visible or public.portfolio_is_admin()
    ), '[]'::jsonb),

    'projectImages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i.id, 'projectId', i.project_id,
               'storagePath', i.storage_path, 'caption', i.caption,
               'mimeType', i.mime_type,
               'width', i.width, 'height', i.height, 'byteSize', i.byte_size,
               'sortOrder', i.sort_order
             ) order by i.sort_order, i.created_at)
      from public.portfolio_project_images i
      where public.portfolio_is_admin()
         or exists (
              select 1 from public.portfolio_projects p
              where p.id = i.project_id and p.visible
            )
    ), '[]'::jsonb),

    'projectCurve', coalesce((
      select jsonb_agg(jsonb_build_object(
               'year', y.year, 'budgetM', y.budget_m, 'impact', y.impact
             ) order by y.year)
      from public.portfolio_project_curve y
    ), '[]'::jsonb),

    'certifications', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id, 'name', c.name, 'issuer', c.issuer,
               'domain', c.domain, 'issued', c.issued_month,
               'expires', c.expires_month, 'credentialId', c.credential_id,
               'credentialUrl', c.credential_url, 'status', c.status,
               'cost', c.cost_m, 'visible', c.visible, 'sortOrder', c.sort_order
             ) order by c.sort_order, c.name)
      from public.portfolio_certifications c
      where c.visible or public.portfolio_is_admin()
    ), '[]'::jsonb),

    'certificationImages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', i.id, 'certificationId', i.certification_id,
               'storagePath', i.storage_path, 'caption', i.caption,
               'mimeType', i.mime_type,
               'width', i.width, 'height', i.height, 'byteSize', i.byte_size,
               'sortOrder', i.sort_order
             ) order by i.sort_order, i.created_at)
      from public.portfolio_certification_images i
      where public.portfolio_is_admin()
         or exists (
              select 1 from public.portfolio_certifications c
              where c.id = i.certification_id and c.visible
            )
    ), '[]'::jsonb),

    'skills', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id, 'name', s.name, 'category', s.category,
               'level', s.level, 'years', s.years, 'lastUsed', s.last_used,
               'evidence', s.evidence, 'visible', s.visible, 'sortOrder', s.sort_order
             ) order by s.sort_order, s.name)
      from public.portfolio_skills s
      where s.visible or public.portfolio_is_admin()
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.portfolio_entries() from public;
grant execute on function public.portfolio_entries() to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. Project photos: register, delete, reorder
--    The object goes straight from the browser to Storage under the admin
--    policy already in place; these functions only record where it went.
-- ---------------------------------------------------------------------------

create or replace function public.portfolio_add_project_image(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_id     uuid;
  v_path   text := public.portfolio_clean_text(p_payload ->> 'storagePath');
  v_parent uuid := nullif(p_payload ->> 'projectId', '')::uuid;
  v_mime   text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_path is null then
    raise exception 'A storage path is required';
  end if;

  if v_parent is null or not exists (
    select 1 from public.portfolio_projects where id = v_parent
  ) then
    raise exception 'That project no longer exists';
  end if;

  -- Falls back to the extension only for a caller that does not send a type.
  v_mime := public.portfolio_clean_text(p_payload ->> 'mimeType');

  if v_mime is null then
    v_mime := case
      when lower(v_path) like '%.png'  then 'image/png'
      when lower(v_path) like '%.webp' then 'image/webp'
      else 'image/jpeg'
    end;
  end if;

  if v_mime not in ('image/jpeg', 'image/png', 'image/webp') then
    raise exception 'Unsupported image type: %', v_mime;
  end if;

  insert into public.portfolio_project_images (
    project_id, storage_path, mime_type, caption,
    width, height, byte_size, sort_order, updated_by
  )
  values (
    v_parent, v_path, v_mime,
    public.portfolio_clean_text(p_payload ->> 'caption'),
    nullif(p_payload ->> 'width', '')::integer,
    nullif(p_payload ->> 'height', '')::integer,
    nullif(p_payload ->> 'byteSize', '')::bigint,
    coalesce(
      (p_payload ->> 'sortOrder')::integer,
      (select coalesce(max(sort_order), 0) + 10
         from public.portfolio_project_images
        where project_id = v_parent)
    ),
    v_email
  )
  returning id into v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'image_add', 'project:' || v_parent, v_path);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_add_project_image(jsonb) from public;
grant execute on function public.portfolio_add_project_image(jsonb) to authenticated;


-- Removes the row and hands the storage path back, so the caller can delete the
-- object it owns. Splitting it this way keeps the database from pretending it
-- can reach into the storage layer.
create or replace function public.portfolio_delete_project_image(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_path  text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  delete from public.portfolio_project_images
   where id = p_id
  returning storage_path into v_path;

  if v_path is null then
    raise exception 'That image no longer exists';
  end if;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'image_delete', 'project_image:' || p_id, v_path);

  perform public.portfolio_bump_data_version();
  return v_path;
end;
$$;

revoke all on function public.portfolio_delete_project_image(uuid) from public;
grant execute on function public.portfolio_delete_project_image(uuid) to authenticated;


create or replace function public.portfolio_reorder_project_images(
  p_project_id uuid,
  p_ids        uuid[]
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
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  update public.portfolio_project_images i
     set sort_order = ordered.position,
         updated_by = v_email
    from (
      select id, (ordinality * 10)::integer as position
      from unnest(coalesce(p_ids, array[]::uuid[])) with ordinality as u(id, ordinality)
    ) ordered
   where i.id = ordered.id
     and i.project_id = p_project_id;

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_reorder_project_images(uuid, uuid[]) from public;
grant execute on function public.portfolio_reorder_project_images(uuid, uuid[]) to authenticated;


-- ---------------------------------------------------------------------------
-- 5. Editing the caption of a photo that is already stored
--    Uploading records a caption, but the owner writes the words after looking
--    at the picture, so the caption has to be editable without deleting and
--    re-uploading the file.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_set_project_image_caption(
  p_id      uuid,
  p_caption text
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
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  update public.portfolio_project_images
     set caption    = public.portfolio_clean_text(p_caption),
         updated_by = v_email
   where id = p_id;

  if not found then
    raise exception 'That image no longer exists';
  end if;

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_set_project_image_caption(uuid, text) from public;
grant execute on function public.portfolio_set_project_image_caption(uuid, text) to authenticated;


-- ---------------------------------------------------------------------------
-- 6. Saving the curve
--    The whole curve arrives in one call, because the chart is edited as a
--    whole and a partial update would leave the line describing a mixture of
--    two intentions. Years that are no longer in the payload are removed, which
--    is also how the owner clears the override and gets the computed line back.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_save_project_curve(p_points jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_kept  integer[] := array[]::integer[];
  v_point jsonb;
  v_year  integer;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if p_points is null or jsonb_typeof(p_points) <> 'array' then
    raise exception 'A list of yearly points is required';
  end if;

  if jsonb_array_length(p_points) > 60 then
    raise exception 'That is more years than the chart can show';
  end if;

  for v_point in select * from jsonb_array_elements(p_points)
  loop
    v_year := nullif(public.portfolio_clean_text(v_point ->> 'year'), '')::integer;

    if v_year is null then
      continue;
    end if;

    insert into public.portfolio_project_curve (year, budget_m, impact, updated_by)
    values (
      v_year,
      coalesce((v_point ->> 'budgetM')::numeric, 0),
      coalesce((v_point ->> 'impact')::integer, 0),
      v_email
    )
    on conflict (year) do update
      set budget_m   = excluded.budget_m,
          impact     = excluded.impact,
          updated_at = now(),
          updated_by = excluded.updated_by;

    v_kept := v_kept || v_year;
  end loop;

  -- An empty payload leaves v_kept empty, and `<> all` on an empty array is
  -- true for every row, so this is also the way the curve is cleared.
  delete from public.portfolio_project_curve
   where year <> all (v_kept);

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'entry_update', 'project_curve',
          array_length(v_kept, 1) || ' year(s) set');

  perform public.portfolio_bump_data_version();
end;
$$;

revoke all on function public.portfolio_save_project_curve(jsonb) from public;
grant execute on function public.portfolio_save_project_curve(jsonb) to authenticated;


-- ---------------------------------------------------------------------------
-- 7. Make the new functions visible to the API immediately
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';
