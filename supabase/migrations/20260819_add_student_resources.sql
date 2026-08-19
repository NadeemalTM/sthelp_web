begin;

create table if not exists public.student_resources (
  resource_key text primary key,
  title text not null check (char_length(title) between 1 and 200),
  category text not null check (char_length(category) between 1 and 100),
  description text not null check (char_length(description) between 1 and 2000),
  url text not null check (char_length(url) between 1 and 1500),
  thumbnail_url text,
  access_type text not null default 'free'
    check (access_type in ('free', 'freemium', 'university', 'paid', 'varies')),
  is_featured boolean not null default false,
  is_published boolean not null default true,
  is_deleted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_resources_public
  on public.student_resources(is_published, is_deleted, sort_order);

alter table public.student_resources enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_resources_updated_at on public.student_resources;
create trigger student_resources_updated_at
  before update on public.student_resources
  for each row execute function public.set_updated_at();

commit;
