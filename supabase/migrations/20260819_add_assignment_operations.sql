begin;

alter table public.assignments
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists assigned_to text,
  add column if not exists quote_status text not null default 'draft'
    check (quote_status in ('draft', 'sent', 'accepted', 'declined')),
  add column if not exists quote_note text,
  add column if not exists quote_sent_at timestamptz,
  add column if not exists quote_responded_at timestamptz;

commit;
