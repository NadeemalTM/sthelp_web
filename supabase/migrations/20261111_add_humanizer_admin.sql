begin;

create table if not exists public.humanizer_plans (
  tier text primary key check (tier in ('free', 'pro', 'ultra')),
  name text not null,
  badge text not null,
  tagline text not null,
  price_lkr text not null,
  price_numeric numeric(12,2) not null default 0,
  billing_period text not null default '/ month',
  single_pass_lkr text not null default '',
  daily_credits integer not null default 3,
  max_words_per_run integer not null default 400,
  monthly_words_label text not null default '',
  features text[] not null default '{}',
  cta_label text not null default 'Select Plan',
  is_featured boolean not null default false,
  allowed_modes text[] not null default array['academic', 'concise'],
  allowed_intensities text[] not null default array['balanced'],
  allow_freeze_keywords boolean not null default false,
  allow_sentence_alternatives boolean not null default false,
  allow_report_download boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.humanizer_subscribers (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null default '',
  customer_whatsapp text not null default '',
  university text not null default '',
  tier text not null check (tier in ('pro', 'ultra')),
  access_code text not null unique,
  status text not null default 'active' check (status in ('active', 'paused', 'expired', 'revoked')),
  daily_credits integer not null default 50,
  max_words_per_run integer not null default 2500,
  credits_used_today integer not null default 0,
  last_usage_date text not null default '',
  total_runs integer not null default 0,
  total_words_processed integer not null default 0,
  last_used_at timestamptz,
  amount_paid_lkr numeric(12,2) not null default 0,
  payment_reference text not null default '',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_humanizer_subscribers_code
  on public.humanizer_subscribers(access_code);

create index if not exists idx_humanizer_subscribers_status
  on public.humanizer_subscribers(status, tier);

alter table public.humanizer_plans enable row level security;
alter table public.humanizer_subscribers enable row level security;

commit;

