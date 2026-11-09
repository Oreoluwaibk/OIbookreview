-- Run this once in the Supabase SQL editor.
-- A book study can name the chapters being studied.

alter table public.studies
  add column if not exists chapters text;
