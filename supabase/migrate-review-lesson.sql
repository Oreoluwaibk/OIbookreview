-- Run this once if reviews already exist.
-- A review now keeps the lesson and what the reader will do with it.

alter table public.reviews
  add column if not exists lesson text;

alter table public.reviews
  add column if not exists application text;

alter table public.reviews
  alter column premise drop not null;

alter table public.reviews
  alter column what_works drop not null;

alter table public.reviews
  alter column where_it_fails drop not null;

alter table public.reviews
  alter column who_should_skip drop not null;

alter table public.reviews
  alter column observation drop not null;
