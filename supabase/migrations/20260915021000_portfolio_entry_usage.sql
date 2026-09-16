-- ============================================================================
-- Which entry lists the owner has actually filled in.
--
-- The site ships with sample entries compiled into the bundle, and the owner
-- chose to start from empty tables. So an empty list has to be read two ways:
--
--   never filled in   -> show the bundled samples, because an empty portfolio
--                        page would look broken rather than unfinished
--   deliberately empty -> show nothing, because the owner removed the samples
--                        on purpose and inventing them back would be dishonest
--
-- The lists themselves cannot tell those apart: a table the owner has hidden
-- every row in looks exactly like a table that was never touched. This file
-- records the first write to each list so the client can tell them apart.
--
-- The flag is written by a statement level trigger rather than by the save
-- functions. Those functions already exist and each one would have to be
-- rewritten to pass its own name; a trigger knows the table it fired on.
-- ============================================================================


create table if not exists public.portfolio_entity_usage (
  entity        text primary key
                  check (entity in (
                    'portfolio_career', 'portfolio_projects',
                    'portfolio_certifications', 'portfolio_skills'
                  )),
  first_write_at timestamptz not null default now()
);

alter table public.portfolio_entity_usage enable row level security;

-- Public on purpose. It reveals only whether the owner has ever written to a
-- list, which is already obvious from the list itself once it is not empty.
drop policy if exists "entry usage is public" on public.portfolio_entity_usage;
create policy "entry usage is public" on public.portfolio_entity_usage
  for select to anon, authenticated
  using (true);

grant select on public.portfolio_entity_usage to anon, authenticated;


create or replace function public.portfolio_record_entity_use()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.portfolio_entity_usage (entity)
  values (TG_TABLE_NAME)
  on conflict (entity) do nothing;

  return null;
end;
$$;

revoke all on function public.portfolio_record_entity_use() from public;


drop trigger if exists portfolio_career_used on public.portfolio_career;
create trigger portfolio_career_used
  after insert on public.portfolio_career
  for each statement execute function public.portfolio_record_entity_use();

drop trigger if exists portfolio_projects_used on public.portfolio_projects;
create trigger portfolio_projects_used
  after insert on public.portfolio_projects
  for each statement execute function public.portfolio_record_entity_use();

drop trigger if exists portfolio_certifications_used on public.portfolio_certifications;
create trigger portfolio_certifications_used
  after insert on public.portfolio_certifications
  for each statement execute function public.portfolio_record_entity_use();

drop trigger if exists portfolio_skills_used on public.portfolio_skills;
create trigger portfolio_skills_used
  after insert on public.portfolio_skills
  for each statement execute function public.portfolio_record_entity_use();


-- Backfill: a list that already holds rows counts as written. Runs against an
-- empty database today, but keeps the flags correct if this file is ever
-- applied after the owner has been using the panel.
insert into public.portfolio_entity_usage (entity)
select 'portfolio_career'      where exists (select 1 from public.portfolio_career)
union all
select 'portfolio_projects'    where exists (select 1 from public.portfolio_projects)
union all
select 'portfolio_certifications' where exists (select 1 from public.portfolio_certifications)
union all
select 'portfolio_skills'      where exists (select 1 from public.portfolio_skills)
on conflict (entity) do nothing;


notify pgrst, 'reload schema';
