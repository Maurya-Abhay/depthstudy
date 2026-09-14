-- ============================================================================
-- Depth Study — Organization B2B completion (ADDITIVE migration)
-- Run on TOP of the existing schema (supabase/database.sql). Do NOT drop or
-- rewrite existing tables, data, or the master schema.
--
-- This file ONLY:
--   * ALTERs existing tables by ADD COLUMN IF NOT EXISTS (never removes data)
--   * CREATEs new tables with IF NOT EXISTS
--   * seeds default plan definitions idempotently (ON CONFLICT DO UPDATE)
--   * adds indexes/constraints/policies scoped to this feature
-- Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend `organizations` with full provisioning profile fields.
-- ---------------------------------------------------------------------------
alter table public.organizations add column if not exists legal_name text;
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists official_email text;
alter table public.organizations add column if not exists website text;
alter table public.organizations add column if not exists address text;
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists state text;
alter table public.organizations add column if not exists country text;
alter table public.organizations add column if not exists postal_code text;
alter table public.organizations add column if not exists contact_person text;
alter table public.organizations add column if not exists notes text;
alter table public.organizations add column if not exists internal_notes text;
alter table public.organizations add column if not exists suspended_reason text;
alter table public.organizations add column if not exists suspended_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Extend organization_members with a member-level lifecycle.
-- ---------------------------------------------------------------------------
alter table public.organization_members add column if not exists status text not null default 'active' check (status in ('active','inactive'));
alter table public.organization_members add column if not exists role_valid boolean not null default true;
alter table public.organization_members add column if not exists deactivated_at timestamptz;
alter table public.organization_members add column if not exists last_seen_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Extend organization_invites with explicit lifecycle status.
-- ---------------------------------------------------------------------------
alter table public.organization_invites add column if not exists status text not null default 'pending' check (status in ('pending','accepted','revoked','expired'));
alter table public.organization_invites add column if not exists revoked_at timestamptz;
alter table public.organization_invites add column if not exists revoked_by uuid references auth.users(id) on delete set null;

-- Broaden the invite role CHECK to include 'owner' so the FIRST owner can be
-- provisioned by invite (platform admin provisions; owner then accepts and
-- becomes the org owner). Safe: only broadens the allowed role set.
alter table public.organization_invites drop constraint if exists organization_invites_role_check;
alter table public.organization_invites add constraint organization_invites_role_check check (role in ('owner','admin','mentor','student'));
-- ---------------------------------------------------------------------------
-- 4. Configurable plan catalog (replaces the hardcoded plan enum for BILLING).
--    Legacy `organizations.plan` text column remains for backward compatibility.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_plan_definitions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  billing_model text not null default 'per_seat' check (billing_model in ('flat','per_student','per_seat','hybrid')),
  monthly_price numeric not null default 0,
  yearly_price numeric not null default 0,
  included_student_seats int not null default 0 check (included_student_seats >= 0),
  extra_student_seat_price numeric not null default 0,
  included_faculty_seats int not null default 0 check (included_faculty_seats >= 0),
  extra_faculty_seat_price numeric not null default 0,
  included_ai_usage numeric not null default 0,
  feature_flags jsonb not null default '{}'::jsonb,
  services jsonb not null default '{}'::jsonb,
  currency text not null default 'INR',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Defer the plan_id FK until the catalog table exists.
alter table public.organizations add column if not exists plan_id uuid references public.organization_plan_definitions(id);

-- Seed default plans idempotently (Business, Enterprise). Safe on repeat runs.
insert into public.organization_plan_definitions
  (code, name, description, billing_model, monthly_price, yearly_price, included_student_seats, extra_student_seat_price, included_faculty_seats, extra_faculty_seat_price, included_ai_usage, feature_flags, services)
values
  ('business', 'Business', 'Standard college workspace bundle.', 'per_seat', 9999, 99990, 100, 199, 10, 299, 5000,
   '{"ai_coach":true,"placement_analytics":true,"certificates":true}',
   '{"courses":true,"tests":true,"dsa":true,"ai_coach":true,"projects":true,"mock_interviews":false,"placement_analytics":true,"certificates":true,"advanced_analytics":false}'),
  ('enterprise', 'Enterprise', 'Unlimited-scale institution bundle.', 'hybrid', 49999, 499990, 500, 99, 50, 149, 50000,
   '{"ai_coach":true,"placement_analytics":true,"certificates":true,"advanced_analytics":true}',
   '{"courses":true,"tests":true,"dsa":true,"ai_coach":true,"projects":true,"mock_interviews":true,"placement_analytics":true,"certificates":true,"advanced_analytics":true}')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  billing_model = excluded.billing_model,
  monthly_price = excluded.monthly_price,
  yearly_price = excluded.yearly_price,
  included_student_seats = excluded.included_student_seats,
  extra_student_seat_price = excluded.extra_student_seat_price,
  included_faculty_seats = excluded.included_faculty_seats,
  extra_faculty_seat_price = excluded.extra_faculty_seat_price,
  included_ai_usage = excluded.included_ai_usage,
  feature_flags = excluded.feature_flags,
  services = excluded.services,
  active = true,
  updated_at = now();
-- ---------------------------------------------------------------------------
-- 5. Provisioning / setup wizard state per organization.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_provisioning (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  current_step int not null default 1,
  total_steps int not null default 11,
  completed_steps jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','in_progress','owner_invited','owner_accepted','complete','suspended')),
  owner_invite_id uuid,
  onboarding_completed boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Configurable organization service/feature entitlements.
--    One row per (organization_id, service). Platform admin flips these ON/OFF.
--    Enforcement happens server-side (see services/entitlements.ts).
-- ---------------------------------------------------------------------------
create table if not exists public.organization_feature_entitlements (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service text not null,
  enabled boolean not null default true,
  quota numeric,
  quota_unit text,
  current_usage numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (organization_id, service)
);
create index if not exists idx_org_feature_ent_org on public.organization_feature_entitlements(organization_id);

-- ---------------------------------------------------------------------------
-- 7. Billing profile + subscription per organization.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_billing_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  billing_email text,
  billing_phone text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  tax_id text,
  currency text not null default 'INR',
  payment_provider text not null default 'none' check (payment_provider in ('none','razorpay','stripe')),
  provider_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid references public.organization_plan_definitions(id) on delete set null,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  billing_model text not null default 'per_seat' check (billing_model in ('flat','per_student','per_seat','hybrid')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','expired')),
  currency text not null default 'INR',
  seat_count int not null default 0,
  active_student_count int not null default 0,
  faculty_count int not null default 0,
  amount numeric not null default 0,
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  next_billing_date timestamptz,
  payment_provider text not null default 'none',
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, billing_cycle)
);
-- ---------------------------------------------------------------------------
-- 8. Invoices + line items. Persisted; never derived only in the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subscription_id uuid references public.organization_subscriptions(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'draft' check (status in ('draft','issued','paid','past_due','void','refunded')),
  currency text not null default 'INR',
  base_amount numeric not null default 0,
  seat_count int not null default 0,
  extra_seats int not null default 0,
  faculty_count int not null default 0,
  extra_faculty int not null default 0,
  extra_seat_charge numeric not null default 0,
  extra_faculty_charge numeric not null default 0,
  tax_amount numeric not null default 0,
  total_amount numeric not null default 0,
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  issue_date timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  provider text,
  provider_invoice_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_org_invoices_org_created on public.organization_invoices(organization_id, created_at desc);

create table if not exists public.organization_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.organization_invoices(id) on delete cascade,
  kind text not null default 'seat',
  description text not null default '',
  quantity numeric not null default 1,
  unit_amount numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_org_invoice_items_inv on public.organization_invoice_items(invoice_id);

-- ---------------------------------------------------------------------------
-- 9. Payments + idempotent webhook event log.
--    Never trust browser-only payment status; webhooks/sync update state.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid references public.organization_invoices(id) on delete set null,
  amount numeric not null default 0,
  currency text not null default 'INR',
  provider text not null default 'none',
  provider_payment_id text,
  status text not null default 'pending' check (status in ('pending','succeeded','failed','refunded')),
  paid_at timestamptz,
  failure_reason text,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_org_payments_org on public.organization_payments(organization_id, created_at desc);

create table if not exists public.billing_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  provider text not null default 'none',
  provider_event_id text,
  event_type text not null default '',
  payload jsonb not null default '{}'::jsonb,
  process_status text not null default 'pending' check (process_status in ('pending','processed','failed','duplicate')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_event_id)
);
create index if not exists idx_billing_events_status on public.billing_events(process_status);
-- ---------------------------------------------------------------------------
-- 10. Usage snapshot + raw usage events (seat/ai/service counts by period).
-- ---------------------------------------------------------------------------
create table if not exists public.organization_usage (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  period text not null,
  student_seats_used int not null default 0,
  faculty_seats_used int not null default 0,
  ai_requests int not null default 0,
  ai_usage_units numeric not null default 0,
  storage_bytes bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (organization_id, period)
);

create table if not exists public.organization_usage_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  usage_type text not null,
  quantity numeric not null default 0,
  unit text,
  user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_org_usage_events_org on public.organization_usage_events(organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 11. Bulk import jobs + row-level results (students/faculty CSV import).
--      Import history is kept; no passwords ever stored here.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  imported_by uuid references auth.users(id) on delete set null,
  kind text not null default 'students' check (kind in ('students','faculty')),
  status text not null default 'pending' check (status in ('pending','validating','preview','imported','failed')),
  filename text,
  total_rows int not null default 0,
  valid_rows int not null default 0,
  error_rows int not null default 0,
  duplicate_rows int not null default 0,
  added_count int not null default 0,
  invited_count int not null default 0,
  already_registered_count int not null default 0,
  skipped_count int not null default 0,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_org_import_jobs_org on public.organization_import_jobs(organization_id, created_at desc);

create table if not exists public.organization_import_rows (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.organization_import_jobs(id) on delete cascade,
  raw jsonb not null default '{}'::jsonb,
  parsed jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','valid','invalid','duplicate','added','invited','already_registered','skipped')),
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_org_import_rows_job on public.organization_import_rows(job_id);

-- ---------------------------------------------------------------------------
-- 12. Faculty/mentor assignment to departments & batches (workload scope).
-- ---------------------------------------------------------------------------
create table if not exists public.faculty_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  faculty_user_id uuid not null references auth.users(id) on delete cascade,
  department_id uuid references public.organization_departments(id) on delete set null,
  batch_id uuid references public.organization_batches(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_faculty_assignments_org on public.faculty_assignments(organization_id);
create index if not exists idx_faculty_assignments_fac on public.faculty_assignments(faculty_user_id);
-- ---------------------------------------------------------------------------
-- 13. RLS + security policies for the new B2B objects.
--      Read: org managers of their own org or platform admins.
--      Write: platform admins (browser writes go through server service-role
--      which bypasses RLS anyway). No cross-org reads possible.
-- ---------------------------------------------------------------------------
alter table public.organization_plan_definitions enable row level security;
drop policy if exists "auth read active plans" on public.organization_plan_definitions;
create policy "auth read active plans" on public.organization_plan_definitions for select using (true);
drop policy if exists "admins manage plans" on public.organization_plan_definitions;
create policy "admins manage plans" on public.organization_plan_definitions for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_provisioning enable row level security;
drop policy if exists "org managers read provisioning" on public.organization_provisioning;
create policy "org managers read provisioning" on public.organization_provisioning for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "org managers update provisioning" on public.organization_provisioning;
create policy "org managers update provisioning" on public.organization_provisioning for update using (public.is_org_manager(organization_id) or public.is_admin()) with check (public.is_org_manager(organization_id) or public.is_admin());

alter table public.organization_feature_entitlements enable row level security;
drop policy if exists "org managers read features" on public.organization_feature_entitlements;
create policy "org managers read features" on public.organization_feature_entitlements for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage features" on public.organization_feature_entitlements;
create policy "admins manage features" on public.organization_feature_entitlements for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_billing_profiles enable row level security;
drop policy if exists "org managers read billing profile" on public.organization_billing_profiles;
create policy "org managers read billing profile" on public.organization_billing_profiles for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "org managers update billing profile" on public.organization_billing_profiles;
create policy "org managers update billing profile" on public.organization_billing_profiles for update using (
  public.is_admin() or exists (select 1 from public.organization_members actor where actor.organization_id = organization_billing_profiles.organization_id and actor.user_id = auth.uid() and actor.role in ('owner','admin'))
) with check (
  public.is_admin() or exists (select 1 from public.organization_members actor where actor.organization_id = organization_billing_profiles.organization_id and actor.user_id = auth.uid() and actor.role in ('owner','admin'))
);

alter table public.organization_subscriptions enable row level security;
drop policy if exists "org managers read subscription" on public.organization_subscriptions;
create policy "org managers read subscription" on public.organization_subscriptions for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage subscriptions" on public.organization_subscriptions;
create policy "admins manage subscriptions" on public.organization_subscriptions for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_invoices enable row level security;
drop policy if exists "org managers read invoices" on public.organization_invoices;
create policy "org managers read invoices" on public.organization_invoices for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage invoices" on public.organization_invoices;
create policy "admins manage invoices" on public.organization_invoices for all using (public.is_admin()) with check (public.is_admin());
alter table public.organization_invoice_items enable row level security;
drop policy if exists "org managers read invoice items" on public.organization_invoice_items;
create policy "org managers read invoice items" on public.organization_invoice_items for select using (
  exists (select 1 from public.organization_invoices i where i.id = organization_invoice_items.invoice_id and public.is_org_manager(i.organization_id)) or public.is_admin()
);
drop policy if exists "admins manage invoice items" on public.organization_invoice_items;
create policy "admins manage invoice items" on public.organization_invoice_items for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_payments enable row level security;
drop policy if exists "org managers read payments" on public.organization_payments;
create policy "org managers read payments" on public.organization_payments for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage payments" on public.organization_payments;
create policy "admins manage payments" on public.organization_payments for all using (public.is_admin()) with check (public.is_admin());

alter table public.billing_events enable row level security;
drop policy if exists "admins manage billing events" on public.billing_events;
create policy "admins manage billing events" on public.billing_events for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_usage enable row level security;
drop policy if exists "org managers read usage" on public.organization_usage;
create policy "org managers read usage" on public.organization_usage for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage usage" on public.organization_usage;
create policy "admins manage usage" on public.organization_usage for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_usage_events enable row level security;
drop policy if exists "org managers read usage events" on public.organization_usage_events;
create policy "org managers read usage events" on public.organization_usage_events for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "admins manage usage events" on public.organization_usage_events;
create policy "admins manage usage events" on public.organization_usage_events for all using (public.is_admin()) with check (public.is_admin());

alter table public.organization_import_jobs enable row level security;
drop policy if exists "org managers read import jobs" on public.organization_import_jobs;
create policy "org managers read import jobs" on public.organization_import_jobs for select using (public.is_org_manager(organization_id) or public.is_admin());
drop policy if exists "org managers write import jobs" on public.organization_import_jobs;
create policy "org managers write import jobs" on public.organization_import_jobs for all using (
  public.is_admin() or exists (select 1 from public.organization_members actor where actor.organization_id = organization_import_jobs.organization_id and actor.user_id = auth.uid() and actor.role in ('owner','admin'))
) with check (
  public.is_admin() or exists (select 1 from public.organization_members actor where actor.organization_id = organization_import_jobs.organization_id and actor.user_id = auth.uid() and actor.role in ('owner','admin'))
);

alter table public.organization_import_rows enable row level security;
drop policy if exists "org managers read import rows" on public.organization_import_rows;
create policy "org managers read import rows" on public.organization_import_rows for select using (
  exists (select 1 from public.organization_import_jobs j where j.id = organization_import_rows.job_id and public.is_org_manager(j.organization_id)) or public.is_admin()
);
drop policy if exists "admins manage import rows" on public.organization_import_rows;
create policy "admins manage import rows" on public.organization_import_rows for all using (public.is_admin()) with check (public.is_admin());

alter table public.faculty_assignments enable row level security;
drop policy if exists "org members read faculty assignments" on public.faculty_assignments;
create policy "org members read faculty assignments" on public.faculty_assignments for select using (public.is_org_member(organization_id) or public.is_admin());
drop policy if exists "org managers write faculty assignments" on public.faculty_assignments;
create policy "org managers write faculty assignments" on public.faculty_assignments for all using (public.is_org_manager(organization_id) or public.is_admin()) with check (public.is_org_manager(organization_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 14. New tables carry the authenticated-role default CRUD grants; RLS scopes
--     every access to the actor's own organization (defense-in-depth on top of
--     the server API layer). Service-role writes bypass RLS for admin actions.
-- ---------------------------------------------------------------------------
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;

-- ---------------------------------------------------------------------------
-- 15. Role grants for the new tables. RLS scopes every browser-role access to
--     the actor's own organization (no cross-org reads). Server pages/APIs use
--     the service-role which bypasses RLS for admin actions.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on
  public.organization_plan_definitions,
  public.organization_provisioning,
  public.organization_feature_entitlements,
  public.organization_billing_profiles,
  public.organization_subscriptions,
  public.organization_invoices,
  public.organization_invoice_items,
  public.organization_payments,
  public.billing_events,
  public.organization_usage,
  public.organization_usage_events,
  public.organization_import_jobs,
  public.organization_import_rows,
  public.faculty_assignments
to authenticated;
-- anon can read the public plan catalog (non-sensitive pricing)
grant select on public.organization_plan_definitions to anon;

-- ---------------------------------------------------------------------------
-- 16. Additive columns for department/batch lifecycle & mentor assignment.
--      Purely additive (ADD COLUMN IF NOT EXISTS); safe on existing data.
-- ---------------------------------------------------------------------------
alter table public.organization_departments add column if not exists description text not null default '';
alter table public.organization_departments add column if not exists archived boolean not null default false;
alter table public.organization_batches add column if not exists code text;
alter table public.organization_batches add column if not exists archived boolean not null default false;
alter table public.organization_batches add column if not exists mentor_id uuid references auth.users(id) on delete set null;