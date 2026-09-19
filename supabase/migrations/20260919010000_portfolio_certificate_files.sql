-- ---------------------------------------------------------------------------
-- Certificate scans gain PDFs.
--
-- Until now a scan had to be a raster image, because the bucket only listed
-- three image MIME types and the table had no way to say what a stored object
-- actually was. Certificates usually arrive as a PDF, so the allowlist grows to
-- include it and the size cap rises to 10 MB, which is the order of magnitude a
-- downloaded or scanned certificate occupies.
--
-- The stored shape records the MIME type rather than inferring it from the file
-- name. A certificate downloaded from an issuer is routinely named something
-- like "certificate.php" or has no extension at all, so the extension is not
-- evidence of anything. The browser already knows the type when the file is
-- picked, and storing it lets the panel and the viewer branch on fact instead
-- of guessing.
--
-- Existing rows are backfilled from a null default only because there is no
-- better source for them; they were uploaded while the bucket still rejected
-- everything that is not a JPEG, PNG, or WebP, so the value is exact.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. The bucket accepts PDFs, and up to 10 MB.
--    The limit and the allowlist live here so they hold even when the browser
--    is bypassed. Adding a file type is strictly widening: neither the upload
--    path nor the read path in the app treats the type as trusted input.
-- ---------------------------------------------------------------------------
update storage.buckets
   set file_size_limit    = 10485760,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
 where id = 'portfolio-media';


-- ---------------------------------------------------------------------------
-- 2. The row records what the object is.
--    Defaulted to image/jpeg so the column can be not null from the start: it
--    is the only type the bucket accepted before this migration, so every
--    existing row really is a JPEG, PNG, or WebP, and the backfill below
--    replaces the guess with the exact value.
-- ---------------------------------------------------------------------------
alter table public.portfolio_certification_images
  add column if not exists mime_type text not null default 'image/jpeg';

-- The check is added separately from the column so re-running is harmless.
alter table public.portfolio_certification_images
  drop constraint if exists portfolio_cert_images_mime_type_check;
alter table public.portfolio_certification_images
  add constraint portfolio_cert_images_mime_type_check
  check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'));

comment on column public.portfolio_certification_images.mime_type is
  'MIME type of the stored object. Recorded on upload, because the file name is not reliable evidence of the type.';

-- Scans uploaded before this migration can only be one of the three image
-- types, and extensions uploaded through the panel are derived from the real
-- file name, so the extension is trustworthy for these rows alone.
update public.portfolio_certification_images
   set mime_type = case
         when lower(storage_path) like '%.png'  then 'image/png'
         when lower(storage_path) like '%.webp' then 'image/webp'
         else 'image/jpeg'
       end
 where mime_type = 'image/jpeg';


-- ---------------------------------------------------------------------------
-- 3. The snapshot carries the type through to the pages.
--    Without this the client would have to guess from the storage path, which
--    is the exact guess this column exists to avoid.
--
--    Copied from the function as it stands in the database rather than from the
--    original migration, because later migrations changed the career and project
--    payloads and those changes must survive.
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
-- 4. The writer accepts a type, and validates it against the same list.
--    The bucket would reject an unlisted type on its own, but only after the
--    object has been stored, which leaves a cleanup to do. Checking here turns
--    that into a plain error before anything is written.
--
--    The type is optional in the payload and defaults to a value derived from
--    the path, so an older client that does not send one still works.
-- ---------------------------------------------------------------------------
create or replace function public.portfolio_add_certification_image(p_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email  text := coalesce(auth.jwt() ->> 'email', 'unknown');
  v_id     uuid;
  v_path   text := public.portfolio_clean_text(p_payload ->> 'storagePath');
  v_parent uuid := nullif(p_payload ->> 'certificationId', '')::uuid;
  v_mime   text;
begin
  if not public.portfolio_is_admin() then
    raise exception 'Not authorised to edit portfolio entries' using errcode = '42501';
  end if;

  if v_path is null then
    raise exception 'A storage path is required';
  end if;

  if v_parent is null or not exists (
    select 1 from public.portfolio_certifications where id = v_parent
  ) then
    raise exception 'That certificate no longer exists';
  end if;

  -- Falls back to the extension only for a caller that predates this column.
  v_mime := public.portfolio_clean_text(p_payload ->> 'mimeType');

  if v_mime is null then
    v_mime := case
      when lower(v_path) like '%.png'  then 'image/png'
      when lower(v_path) like '%.webp' then 'image/webp'
      when lower(v_path) like '%.pdf'  then 'application/pdf'
      else 'image/jpeg'
    end;
  end if;

  if v_mime not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
    raise exception 'Unsupported file type: %', v_mime;
  end if;

  insert into public.portfolio_certification_images (
    certification_id, storage_path, mime_type, caption,
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
         from public.portfolio_certification_images
        where certification_id = v_parent)
    ),
    v_email
  )
  returning id into v_id;

  insert into public.portfolio_activity (actor, action, target, detail)
  values (v_email, 'image_add', 'certification:' || v_parent, v_path);

  perform public.portfolio_bump_data_version();
  return v_id;
end;
$$;

revoke all on function public.portfolio_add_certification_image(jsonb) from public;
grant execute on function public.portfolio_add_certification_image(jsonb) to authenticated;
