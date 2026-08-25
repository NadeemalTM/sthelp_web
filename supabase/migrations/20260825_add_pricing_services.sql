begin;

create table if not exists public.pricing_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null
    check (char_length(name) between 1 and 120),
  short_description text not null
    check (char_length(short_description) between 1 and 1000),
  starting_price numeric(12,2),
  currency text not null default 'LKR'
    check (currency = 'LKR'),
  features text[] not null default '{}',
  is_custom boolean not null default false,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  is_deleted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pricing_services_price_check check (
    (is_custom and starting_price is null)
    or (not is_custom and starting_price > 0)
  )
);

alter table public.assignments
  add column if not exists pricing_service_id uuid
    references public.pricing_services(id) on delete set null,
  add column if not exists pricing_name_snapshot text,
  add column if not exists starting_price_snapshot numeric(12,2),
  add column if not exists starting_currency_snapshot text;

create index if not exists idx_pricing_services_public
  on public.pricing_services(is_published, is_deleted, sort_order);

create index if not exists idx_assignments_pricing_service
  on public.assignments(pricing_service_id);

alter table public.pricing_services enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pricing_services_updated_at on public.pricing_services;
create trigger pricing_services_updated_at
  before update on public.pricing_services
  for each row execute function public.set_updated_at();

insert into public.pricing_services
  (slug, name, short_description, starting_price, currency, features, is_custom, is_featured, sort_order)
values
  ('web-development', 'Web development', 'Websites and browser-based application support tailored to the submitted brief.', 5000, 'LKR', array['Responsive interface', 'Project guidance', 'Scope-based final quote'], false, true, 10),
  ('mobile-app', 'Mobile app development', 'Mobile application support for Android, iOS and cross-platform coursework projects.', 5000, 'LKR', array['App planning', 'Interface support', 'Scope-based final quote'], false, false, 20),
  ('research', 'Research support', 'Structured research guidance, planning, sources, methodology and academic presentation support.', 5000, 'LKR', array['Research planning', 'Methodology guidance', 'Referencing support'], false, true, 30),
  ('report-writing', 'Report writing support', 'Report structure, editing, analysis and presentation support based on your requirements.', 2000, 'LKR', array['Clear structure', 'Editing support', 'Referencing guidance'], false, false, 40),
  ('presentation', 'Presentation support', 'Clear, modern slide design and presentation guidance for academic or project work.', 1000, 'LKR', array['Slide structure', 'Visual consistency', 'Presentation guidance'], false, false, 50),
  ('data-analysis', 'Data analysis', 'Spreadsheet, statistical and data-interpretation support with clear explanations.', 4000, 'LKR', array['Data preparation', 'Charts and findings', 'Interpretation guidance'], false, true, 60),
  ('custom', 'Other / custom order', 'Tell us what you need and we will provide a tailored quotation after reviewing the brief.', null, 'LKR', array['Any supported subject area', 'Requirements review', 'Tailored quotation'], true, false, 70)
on conflict (slug) do nothing;

commit;
