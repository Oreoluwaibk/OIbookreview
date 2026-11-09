-- Run this once in the Supabase SQL editor.
-- It adds public Bible studies beside the book reviews.

create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  theme text not null check (theme in ('book', 'topic', 'character', 'other')),
  theme_label text,
  subject text not null,
  notes text,
  lesson text,
  application text,
  created_at timestamptz not null default now(),
  check (theme <> 'other' or nullif(trim(theme_label), '') is not null)
);

create table if not exists public.study_verses (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  reference text not null,
  version text not null check (version in ('KJV', 'NKJV', 'TPT', 'NLT', 'AMP')),
  text text not null,
  attribution text not null,
  position integer not null default 0
);

alter table public.studies
  add column if not exists chapters text;

alter table public.studies
  add column if not exists visibility text not null default 'public';

alter table public.studies
  drop constraint if exists studies_visibility_check;

alter table public.studies
  add constraint studies_visibility_check
  check (visibility in ('public', 'private'));

create index if not exists studies_created_at_idx on public.studies (created_at desc);
create index if not exists studies_theme_subject_idx on public.studies (theme, subject);

alter table public.studies enable row level security;
alter table public.study_verses enable row level security;

drop policy if exists "Anyone can read studies" on public.studies;
drop policy if exists "Studies are public or private to the author" on public.studies;
create policy "Studies are public or private to the author"
  on public.studies for select
  to anon, authenticated
  using (visibility = 'public' or auth.uid() = user_id);

drop policy if exists "Readers publish their own studies" on public.studies;
create policy "Readers publish their own studies"
  on public.studies for insert
  to authenticated
  with check (auth.uid() = user_id);

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

drop policy if exists "Readers add verses to their own studies" on public.study_verses;
create policy "Readers add verses to their own studies"
  on public.study_verses for insert
  to authenticated
  with check (
    exists (
      select 1 from public.studies
      where studies.id = study_id and studies.user_id = auth.uid()
    )
  );
