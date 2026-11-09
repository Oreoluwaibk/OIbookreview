-- Run this once if you already applied schema.sql.
-- It lets a review cover the whole book or one chapter.

alter table public.reviews
  alter column reading_id drop not null;

alter table public.reviews
  drop constraint if exists reviews_reading_id_fkey;

alter table public.reviews
  add constraint reviews_reading_id_fkey
  foreign key (reading_id) references public.readings (id) on delete set null;

alter table public.reviews
  add column if not exists scope text not null default 'book';

alter table public.reviews
  add column if not exists chapter_label text;

alter table public.reviews
  drop constraint if exists reviews_scope_check;

alter table public.reviews
  add constraint reviews_scope_check check (scope in ('book', 'chapter'));

alter table public.reviews
  drop constraint if exists reviews_chapter_label_check;

alter table public.reviews
  add constraint reviews_chapter_label_check check (
    (scope = 'book' and chapter_label is null)
    or (scope = 'chapter' and nullif(trim(chapter_label), '') is not null)
  );

drop policy if exists "Signed-in readers can see profiles" on public.profiles;
drop policy if exists "Anyone can see profile names" on public.profiles;

create policy "Anyone can see profile names"
  on public.profiles for select
  to anon, authenticated
  using (true);
