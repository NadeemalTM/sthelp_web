alter table public.assignments
  add column if not exists calculation_details jsonb;
