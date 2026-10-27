-- StHelp Assignment Support Portal
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
    business_name text not null default 'StHelp Assignment Service',
    whatsapp_number text not null default '94782067550',
    business_phone text,
    business_email text,
    business_address text,
  bank_name text not null default 'Your Bank',
  account_name text not null default 'StHelp',
  account_number text not null default '0000000000',
  bank_branch text not null default 'Your Branch',
  bank_name_2 text,
  account_name_2 text,
  account_number_2 text,
  bank_branch_2 text,
  payment_note text not null default 'Use your client ID as the payment reference.',
  currency text not null default 'LKR',
  support_notice text not null default 'We provide tutoring, editing, research guidance, software development support and learning assistance. Clients are responsible for following their university rules.',
  updated_at timestamptz not null default now()
);

-- Public service catalogue. Prices are advertised as starting estimates; each
-- assignment receives its own reviewed quotation before payment.
create table if not exists public.pricing_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  short_description text not null check (char_length(short_description) between 1 and 1000),
  starting_price numeric(12,2),
  currency text not null default 'LKR' check (currency = 'LKR'),
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

-- Keep existing installations in sync. CREATE TABLE IF NOT EXISTS does not add
-- columns when the settings table was created by an older schema version.
  alter table public.settings
    add column if not exists business_phone text,
    add column if not exists business_email text,
    add column if not exists business_address text,
    add column if not exists bank_name_2 text,
  add column if not exists account_name_2 text,
  add column if not exists account_number_2 text,
  add column if not exists bank_branch_2 text;

create table if not exists public.client_links (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  client_id text not null,
  access_pin_hash text not null,
  client_name text,
  phone text,
  status text not null default 'created' check (status in ('created','submitted','accepted','closed')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  client_link_id uuid not null unique references public.client_links(id) on delete cascade,
  student_name text not null,
  contact_number text not null,
  email text,
  university text not null,
  programme text,
  module_name text,
  assignment_title text not null,
  service_type text not null,
  pricing_service_id uuid references public.pricing_services(id) on delete set null,
  pricing_name_snapshot text,
  starting_price_snapshot numeric(12,2),
  starting_currency_snapshot text,
  academic_level text,
  deadline timestamptz not null,
  is_group boolean not null default false,
  group_members integer,
  description text not null,
  special_instructions text,
  quoted_amount numeric(12,2),
  currency text not null default 'LKR',
  status text not null default 'submitted' check (status in ('submitted','accepted','in_progress','client_review','revision','completed','delivered','cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  payment_status text not null default 'not_submitted' check (payment_status in ('not_submitted','submitted','verified','rejected')),
  payment_reference text,
  payment_note text,
  payment_submitted_at timestamptz,
  payment_verified_at timestamptz,
  download_unlocked boolean not null default false,
  final_message text,
  feedback_submitted boolean not null default false,
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep installations created before the pricing catalogue in sync when this
-- full schema is run again.
alter table public.assignments
  add column if not exists pricing_service_id uuid references public.pricing_services(id) on delete set null,
  add column if not exists pricing_name_snapshot text,
  add column if not exists starting_price_snapshot numeric(12,2),
  add column if not exists starting_currency_snapshot text;

create table if not exists public.assignment_files (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  kind text not null check (kind in ('support','payment_proof','preview','final')),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  title text not null,
  details text,
  progress integer not null check (progress between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  author text not null check (author in ('client','admin')),
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null,
  image_url text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid unique references public.assignments(id) on delete set null,
  customer_name text not null,
  university text,
  rating integer not null default 5 check (rating between 1 and 5),
  feedback text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public student-resource directory. Built-in resources live in the application;
-- this table stores admin edits, visibility changes and custom additions.
create table if not exists public.student_resources (
  resource_key text primary key,
  title text not null check (char_length(title) between 1 and 200),
  category text not null check (char_length(category) between 1 and 100),
  description text not null check (char_length(description) between 1 and 2000),
  url text not null check (char_length(url) between 1 and 1500),
  thumbnail_url text,
  access_type text not null default 'free' check (access_type in ('free', 'freemium', 'university', 'paid', 'varies')),
  is_featured boolean not null default false,
  is_published boolean not null default true,
  is_deleted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assignment operations: quotes, ownership, priority and a permanent activity history.
alter table public.assignments
  add column if not exists priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists assigned_to text,
  add column if not exists quote_status text not null default 'draft' check (quote_status in ('draft', 'sent', 'accepted', 'declined')),
  add column if not exists quote_note text,
  add column if not exists quote_sent_at timestamptz,
  add column if not exists quote_responded_at timestamptz;

create table if not exists public.assignment_activity (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  actor text not null check (actor in ('client', 'admin', 'system')),
  visibility text not null default 'admin' check (visibility in ('admin', 'client', 'both')),
  event_type text not null,
  summary text not null check (char_length(summary) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Immutable PayHere checkout attempts. Keeping provider transactions separate
-- from the assignment aggregate makes retries, duplicate payments and
-- chargebacks safely auditable.
create table if not exists public.payhere_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  order_id text not null unique check (char_length(order_id) between 1 and 100),
  expected_amount numeric(12,2) not null check (expected_amount > 0),
  expected_currency text not null check (expected_currency in ('LKR', 'USD')),
  quote_sent_at_snapshot timestamptz,
  quote_responded_at_snapshot timestamptz,
  status text not null default 'initiated' check (status in ('initiated', 'pending', 'paid', 'cancelled', 'failed', 'superseded', 'refunded', 'charged_back')),
  payhere_payment_id text,
  payhere_amount numeric(12,2),
  payhere_currency text,
  payment_method text,
  status_code integer,
  status_message text,
  review_reason text,
  expires_at timestamptz not null default (now() + interval '20 minutes'),
  notified_at timestamptz,
  paid_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assignments
  add column if not exists payhere_payment_attempt_id uuid;

create unique index if not exists idx_payhere_attempts_id_assignment
  on public.payhere_payment_attempts(id, assignment_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'assignments_payhere_attempt_owner_fk'
      and conrelid = 'public.assignments'::regclass
  ) then
    alter table public.assignments
      add constraint assignments_payhere_attempt_owner_fk
      foreign key (payhere_payment_attempt_id, id)
      references public.payhere_payment_attempts(id, assignment_id)
      on delete restrict;
  end if;
end
$$;

-- One-time public review URLs for customers who do not have a client portal.
create table if not exists public.feedback_links (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  customer_name text,
  university text,
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.testimonials
  add column if not exists feedback_link_id uuid unique references public.feedback_links(id) on delete set null;

create index if not exists idx_client_links_token on public.client_links(token);
create index if not exists idx_client_links_client_id on public.client_links(client_id);
create unique index if not exists idx_client_links_id_pin on public.client_links(client_id, access_pin_hash);
create index if not exists idx_assignments_status on public.assignments(status);
create index if not exists idx_assignment_files_assignment on public.assignment_files(assignment_id);
create index if not exists idx_progress_assignment on public.progress_updates(assignment_id, created_at);
create index if not exists idx_comments_assignment on public.comments(assignment_id, created_at);
create index if not exists idx_feedback_links_token on public.feedback_links(token);
create index if not exists idx_assignment_activity_assignment on public.assignment_activity(assignment_id, created_at desc);
create index if not exists idx_payhere_attempts_assignment on public.payhere_payment_attempts(assignment_id, created_at desc);
create unique index if not exists idx_payhere_attempts_payment_id on public.payhere_payment_attempts(payhere_payment_id) where payhere_payment_id is not null and payhere_payment_id <> '';
create index if not exists idx_assignments_payhere_attempt on public.assignments(payhere_payment_attempt_id);
create index if not exists idx_student_resources_public on public.student_resources(is_published, is_deleted, sort_order);
create index if not exists idx_pricing_services_public on public.pricing_services(is_published, is_deleted, sort_order);
create index if not exists idx_assignments_pricing_service on public.assignments(pricing_service_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings for each row execute function public.set_updated_at();
drop trigger if exists client_links_updated_at on public.client_links;
create trigger client_links_updated_at before update on public.client_links for each row execute function public.set_updated_at();
drop trigger if exists assignments_updated_at on public.assignments;
create trigger assignments_updated_at before update on public.assignments for each row execute function public.set_updated_at();
drop trigger if exists portfolio_updated_at on public.portfolio_items;
create trigger portfolio_updated_at before update on public.portfolio_items for each row execute function public.set_updated_at();
drop trigger if exists testimonials_updated_at on public.testimonials;
create trigger testimonials_updated_at before update on public.testimonials for each row execute function public.set_updated_at();
drop trigger if exists student_resources_updated_at on public.student_resources;
create trigger student_resources_updated_at before update on public.student_resources for each row execute function public.set_updated_at();
drop trigger if exists pricing_services_updated_at on public.pricing_services;
create trigger pricing_services_updated_at before update on public.pricing_services for each row execute function public.set_updated_at();
drop trigger if exists payhere_payment_attempts_updated_at on public.payhere_payment_attempts;
create trigger payhere_payment_attempts_updated_at before update on public.payhere_payment_attempts for each row execute function public.set_updated_at();

-- Transactional, service-role-only reconciliation for exceptional PayHere
-- states that an administrator has first confirmed in the PayHere dashboard.
create or replace function public.apply_reviewed_payhere_payment(
  p_assignment_id uuid,
  p_attempt_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public.assignments%rowtype;
  v_attempt public.payhere_payment_attempts%rowtype;
  v_now timestamptz := now();
begin
  select * into v_attempt from public.payhere_payment_attempts
    where id = p_attempt_id and assignment_id = p_assignment_id for update;
  if not found then raise exception 'PayHere payment attempt not found'; end if;
  select * into v_assignment from public.assignments
    where id = p_assignment_id for update;
  if not found then raise exception 'Assignment not found'; end if;

  if v_assignment.payment_status = 'verified'
     and v_assignment.payhere_payment_attempt_id = v_attempt.id
     and v_attempt.status = 'paid' then
    update public.payhere_payment_attempts
      set applied_at = coalesce(applied_at, v_now), review_reason = null
      where id = v_attempt.id;
    return true;
  end if;
  if v_attempt.status <> 'paid' then raise exception 'The PayHere transaction is not paid'; end if;
  if nullif(v_attempt.payhere_payment_id, '') is null then raise exception 'The PayHere payment ID is missing'; end if;
  if v_assignment.payhere_payment_attempt_id is distinct from v_attempt.id then raise exception 'This is not the assignment current PayHere transaction'; end if;
  if v_assignment.status = 'cancelled' or v_assignment.quote_status <> 'accepted' then raise exception 'The assignment quotation is not accepted'; end if;
  if v_assignment.payment_status = 'verified' then raise exception 'Another payment already verifies this assignment'; end if;
  if v_attempt.payhere_amount is null
     or round(v_attempt.expected_amount, 2) <> round(v_attempt.payhere_amount, 2)
     or v_assignment.quoted_amount is null
     or round(v_attempt.expected_amount, 2) <> round(v_assignment.quoted_amount, 2)
     or upper(v_attempt.expected_currency) <> upper(coalesce(v_attempt.payhere_currency, ''))
     or upper(v_attempt.expected_currency) <> upper(coalesce(v_assignment.currency, 'LKR')) then
    raise exception 'The paid amount or currency does not match the accepted quotation';
  end if;

  update public.payhere_payment_attempts
    set applied_at = coalesce(applied_at, v_now), review_reason = null
    where id = v_attempt.id and status = 'paid';
  update public.assignments
    set payment_status = 'verified',
        payment_reference = v_attempt.payhere_payment_id,
        payment_note = 'PayHere payment reviewed and verified by admin.',
        payment_submitted_at = coalesce(payment_submitted_at, v_now),
        payment_verified_at = v_now,
        payhere_payment_attempt_id = v_attempt.id
    where id = v_assignment.id;
  return true;
end;
$$;

create or replace function public.resolve_payhere_payment_attempt(
  p_assignment_id uuid,
  p_attempt_id uuid,
  p_resolution text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public.assignments%rowtype;
  v_attempt public.payhere_payment_attempts%rowtype;
begin
  select * into v_attempt from public.payhere_payment_attempts
    where id = p_attempt_id and assignment_id = p_assignment_id for update;
  if not found then raise exception 'PayHere payment attempt not found'; end if;
  select * into v_assignment from public.assignments
    where id = p_assignment_id for update;
  if not found then raise exception 'Assignment not found'; end if;

  if p_resolution = 'close' then
    if v_attempt.status not in ('initiated', 'pending') then raise exception 'Only an open checkout can be closed'; end if;
    update public.payhere_payment_attempts
      set status = 'cancelled', status_message = 'Closed by admin after checking the PayHere dashboard.', review_reason = null
      where id = v_attempt.id;
    if v_assignment.payhere_payment_attempt_id = v_attempt.id and v_assignment.payment_status <> 'verified' then
      update public.assignments set payhere_payment_attempt_id = null where id = v_assignment.id;
    end if;
  elsif p_resolution = 'refunded' then
    if v_attempt.status <> 'paid' then raise exception 'Only a paid PayHere transaction can be marked refunded'; end if;
    update public.payhere_payment_attempts
      set status = 'refunded', status_message = 'Refund confirmed by admin after completion in PayHere.', review_reason = null
      where id = v_attempt.id;
    if v_assignment.payhere_payment_attempt_id = v_attempt.id then
      update public.assignments
        set payment_status = case when payment_status = 'verified' then 'rejected' else payment_status end,
            payment_note = 'The PayHere payment was refunded.',
            payment_verified_at = case when payment_status = 'verified' then null else payment_verified_at end,
            download_unlocked = false,
            payhere_payment_attempt_id = null
        where id = v_assignment.id;
    end if;
  elsif p_resolution = 'chargeback_resolved' then
    if v_attempt.status <> 'charged_back' then raise exception 'This transaction does not have a chargeback'; end if;
    if v_assignment.payhere_payment_attempt_id = v_attempt.id then
      update public.assignments set payhere_payment_attempt_id = null, download_unlocked = false
        where id = v_assignment.id;
    end if;
  else
    raise exception 'Invalid PayHere resolution';
  end if;
  return true;
end;
$$;

revoke all on function public.apply_reviewed_payhere_payment(uuid, uuid) from public, anon, authenticated;
revoke all on function public.resolve_payhere_payment_attempt(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.apply_reviewed_payhere_payment(uuid, uuid) to service_role;
grant execute on function public.resolve_payhere_payment_attempt(uuid, uuid, text) to service_role;

-- The application uses the service-role key only in server routes. No public table
-- policies are created, so browser users cannot query these tables directly.
alter table public.settings enable row level security;
alter table public.client_links enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_files enable row level security;
alter table public.progress_updates enable row level security;
alter table public.comments enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.feedback_links enable row level security;
alter table public.assignment_activity enable row level security;
alter table public.student_resources enable row level security;
alter table public.pricing_services enable row level security;
alter table public.payhere_payment_attempts enable row level security;

insert into public.settings (id) values (1) on conflict (id) do nothing;

insert into public.portfolio_items (title, category, description, sort_order)
select * from (values
  ('Responsive Web Application', 'Computing', 'A mobile-friendly web system with authentication, dashboards and reports.', 1),
  ('Business Research Report', 'Business', 'Structured research support with clear analysis, references and presentation guidance.', 2),
  ('Data Analysis Workbook', 'Data & Excel', 'Clean spreadsheet modelling, charts, formulas and interpretation support.', 3)
) as seed(title, category, description, sort_order)
where not exists (select 1 from public.portfolio_items);

insert into public.testimonials (customer_name, university, rating, feedback, is_published)
select * from (values
  ('Verified Student', 'Sri Lankan University', 5, 'The progress updates were clear and communication was easy throughout the project.', true),
  ('Verified Student', 'Private Higher Education Institute', 5, 'Fast response, clear guidance and the requested revisions were handled properly.', true)
) as seed(customer_name, university, rating, feedback, is_published)
where not exists (select 1 from public.testimonials);

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

-- Private storage bucket. 25 MB is used for final files; the application enforces
-- a stricter 5 MB limit for client support documents and payment proofs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-files',
  'assignment-files',
  false,
  26214400,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/octet-stream',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public storage bucket for portfolio images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
