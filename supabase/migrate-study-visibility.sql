-- Run this once in the Supabase SQL editor.
-- Each study can be public, or private to the person who wrote it.

alter table public.studies
  add column if not exists visibility text not null default 'public';

alter table public.studies
  drop constraint if exists studies_visibility_check;

alter table public.studies
  add constraint studies_visibility_check
  check (visibility in ('public', 'private'));

drop policy if exists "Anyone can read studies" on public.studies;
drop policy if exists "Studies are public or private to the author" on public.studies;
create policy "Studies are public or private to the author"
  on public.studies for select
  to anon, authenticated
  using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "Anyone can read study verses" on public.study_verses;
drop policy if exists "Verses follow the study" on public.study_verses;
create policy "Verses follow the study"
  on public.study_verses for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.studies
      where studies.id = study_id
        and (studies.visibility = 'public' or studies.user_id = auth.uid())
    )
  );
