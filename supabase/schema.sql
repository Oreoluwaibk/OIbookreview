-- Run this once in the Supabase SQL editor.
-- It creates the shelf for phase 1 and the tables phase 2 and 3 will use.

create extension if not exists pgcrypto;

create type public.reading_status as enum ('want', 'reading', 'finished', 'stopped');
create type public.reading_format as enum ('print', 'ebook', 'audio');
create type public.copy_source as enum ('bought', 'library', 'advance');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  open_library_work_key text not null unique,
  title text not null,
  authors text[] not null default '{}',
  cover_url text,
  first_publish_year integer,
  created_at timestamptz not null default now()
);

create table public.editions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  open_library_edition_key text,
  isbn13 text,
  publisher text,
  publish_year integer,
  translator text,
  page_count integer,
  unique (book_id, open_library_edition_key)
);

create table public.readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  edition_id uuid references public.editions (id) on delete set null,
  status public.reading_status not null default 'want',
  format public.reading_format not null default 'print',
  progress_percent integer check (progress_percent between 0 and 100),
  copy_source public.copy_source,
  started_on date,
  finished_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reading_id uuid not null references public.readings (id) on delete cascade,
  page_label text,
  quote text,
  why_it_mattered text not null,
  created_at timestamptz not null default now()
);

create table public.recall_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reading_id uuid not null references public.readings (id) on delete cascade,
  about text not null,
  who_mattered text,
  line_that_stuck text,
  why_rated text,
  next_due_on date not null,
  interval_stage integer not null default 0 check (interval_stage between 0 and 3),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reading_id uuid references public.readings (id) on delete set null,
  book_id uuid not null references public.books (id) on delete cascade,
  scope text not null default 'book' check (scope in ('book', 'chapter')),
  chapter_label text,
  lesson text not null,
  application text not null,
  who_its_for text not null,
  who_should_skip text,
  observation text,
  stars numeric(2, 1) check (stars between 1 and 5),
  version_label text not null default 'first',
  created_at timestamptz not null default now(),
  check (
    (scope = 'book' and chapter_label is null)
    or (scope = 'chapter' and nullif(trim(chapter_label), '') is not null)
  )
);

create index readings_user_id_idx on public.readings (user_id, updated_at desc);
create index notes_user_id_idx on public.notes (user_id);
create index reviews_book_id_idx on public.reviews (book_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.editions enable row level security;
alter table public.readings enable row level security;
alter table public.notes enable row level security;
alter table public.recall_cards enable row level security;
alter table public.reviews enable row level security;

create policy "Anyone can see profile names"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Readers update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Anyone can read cached books"
  on public.books for select
  to anon, authenticated
  using (true);

create policy "Signed-in readers can save a book"
  on public.books for insert
  to authenticated
  with check (true);

create policy "Signed-in readers can refresh a cached book"
  on public.books for update
  to authenticated
  using (true)
  with check (true);

create policy "Anyone can read editions"
  on public.editions for select
  to anon, authenticated
  using (true);

create policy "Signed-in readers can save an edition"
  on public.editions for insert
  to authenticated
  with check (true);

create policy "Signed-in readers can refresh an edition"
  on public.editions for update
  to authenticated
  using (true)
  with check (true);

create policy "Readers see their own readings"
  on public.readings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Readers add their own readings"
  on public.readings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Readers update their own readings"
  on public.readings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Readers delete their own readings"
  on public.readings for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Readers see their own notes"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Readers add their own notes"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Readers update their own notes"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Readers delete their own notes"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Readers see their own recall cards"
  on public.recall_cards for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Readers add their own recall cards"
  on public.recall_cards for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Readers update their own recall cards"
  on public.recall_cards for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Anyone can read published reviews"
  on public.reviews for select
  to anon, authenticated
  using (true);

create policy "Readers publish their own reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Readers update their own reviews"
  on public.reviews for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Readers delete their own reviews"
  on public.reviews for delete
  to authenticated
  using (auth.uid() = user_id);

create table public.studies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  theme text not null check (theme in ('book', 'topic', 'character', 'other')),
  theme_label text,
  subject text not null,
  chapters text,
  notes text,
  lesson text,
  application text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  check (theme <> 'other' or nullif(trim(theme_label), '') is not null)
);

create table public.study_verses (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  reference text not null,
  version text not null check (version in ('KJV', 'NKJV', 'TPT', 'NLT', 'AMP')),
  text text not null,
  attribution text not null,
  position integer not null default 0
);

create index studies_created_at_idx on public.studies (created_at desc);
create index studies_theme_subject_idx on public.studies (theme, subject);

alter table public.studies enable row level security;
alter table public.study_verses enable row level security;

create policy "Studies are public or private to the author"
  on public.studies for select
  to anon, authenticated
  using (visibility = 'public' or auth.uid() = user_id);

create policy "Readers publish their own studies"
  on public.studies for insert
  to authenticated
  with check (auth.uid() = user_id);

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

create policy "Readers add verses to their own studies"
  on public.study_verses for insert
  to authenticated
  with check (
    exists (
      select 1 from public.studies
      where studies.id = study_id and studies.user_id = auth.uid()
    )
  );
