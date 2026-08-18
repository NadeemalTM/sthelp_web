-- Adds optional secondary payment-account fields to existing StHelp databases.
-- Safe to run more than once in the Supabase SQL Editor.

begin;

alter table public.settings
  add column if not exists bank_name_2 text,
  add column if not exists account_name_2 text,
  add column if not exists account_number_2 text,
  add column if not exists bank_branch_2 text;

commit;
