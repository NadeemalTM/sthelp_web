begin;

-- Every PayHere redirect receives its own immutable order and quotation
-- snapshot. The assignment keeps only the aggregate status used by the portal;
-- this ledger is the source of truth for callbacks, retries and chargebacks.
create table if not exists public.payhere_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete restrict,
  order_id text not null unique
    check (char_length(order_id) between 1 and 100),
  expected_amount numeric(12,2) not null
    check (expected_amount > 0),
  expected_currency text not null
    check (expected_currency in ('LKR', 'USD')),
  quote_sent_at_snapshot timestamptz,
  quote_responded_at_snapshot timestamptz,
  status text not null default 'initiated'
    check (status in ('initiated', 'pending', 'paid', 'cancelled', 'failed', 'superseded', 'refunded', 'charged_back')),
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

create index if not exists idx_payhere_attempts_assignment
  on public.payhere_payment_attempts(assignment_id, created_at desc);

create unique index if not exists idx_payhere_attempts_payment_id
  on public.payhere_payment_attempts(payhere_payment_id)
  where payhere_payment_id is not null and payhere_payment_id <> '';

create unique index if not exists idx_payhere_attempts_id_assignment
  on public.payhere_payment_attempts(id, assignment_id);

alter table public.assignments
  add column if not exists payhere_payment_attempt_id uuid;

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

create index if not exists idx_assignments_payhere_attempt
  on public.assignments(payhere_payment_attempt_id);

alter table public.payhere_payment_attempts enable row level security;

drop trigger if exists payhere_payment_attempts_updated_at
  on public.payhere_payment_attempts;
create trigger payhere_payment_attempts_updated_at
  before update on public.payhere_payment_attempts
  for each row execute function public.set_updated_at();

-- Admin reconciliation runs transactionally so a PayHere callback cannot race
-- an administrator applying or resolving the same provider transaction.
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
  select * into v_attempt
  from public.payhere_payment_attempts
  where id = p_attempt_id and assignment_id = p_assignment_id
  for update;
  if not found then raise exception 'PayHere payment attempt not found'; end if;

  select * into v_assignment
  from public.assignments
  where id = p_assignment_id
  for update;
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
  select * into v_attempt
  from public.payhere_payment_attempts
  where id = p_attempt_id and assignment_id = p_assignment_id
  for update;
  if not found then raise exception 'PayHere payment attempt not found'; end if;

  select * into v_assignment
  from public.assignments
  where id = p_assignment_id
  for update;
  if not found then raise exception 'Assignment not found'; end if;

  if p_resolution = 'close' then
    if v_attempt.status not in ('initiated', 'pending') then raise exception 'Only an open checkout can be closed'; end if;
    update public.payhere_payment_attempts
      set status = 'cancelled',
          status_message = 'Closed by admin after checking the PayHere dashboard.',
          review_reason = null
      where id = v_attempt.id;
    if v_assignment.payhere_payment_attempt_id = v_attempt.id
       and v_assignment.payment_status <> 'verified' then
      update public.assignments set payhere_payment_attempt_id = null
        where id = v_assignment.id;
    end if;
  elsif p_resolution = 'refunded' then
    if v_attempt.status <> 'paid' then raise exception 'Only a paid PayHere transaction can be marked refunded'; end if;
    update public.payhere_payment_attempts
      set status = 'refunded',
          status_message = 'Refund confirmed by admin after completion in PayHere.',
          review_reason = null
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
      update public.assignments
        set payhere_payment_attempt_id = null,
            download_unlocked = false
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

commit;
