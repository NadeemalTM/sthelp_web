-- Adds the public business contact details required by payment providers.
-- Safe to run more than once in the Supabase SQL Editor.

begin;

alter table public.settings
  add column if not exists business_phone text,
  add column if not exists business_email text,
  add column if not exists business_address text;

commit;
