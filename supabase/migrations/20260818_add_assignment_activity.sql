-- Adds the assignment activity log to databases created before activity tracking.
-- Safe to run more than once in the Supabase SQL Editor.

begin;

create table if not exists public.assignment_activity (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  actor text not null check (actor in ('client', 'admin', 'system')),
  visibility text not null default 'admin' check (visibility in ('admin', 'client', 'both')),
  event_type text not null,
  summary text not null check (char_length(summary) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists idx_assignment_activity_assignment
  on public.assignment_activity(assignment_id, created_at desc);

alter table public.assignment_activity enable row level security;

commit;
