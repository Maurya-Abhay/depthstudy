-- ============================================================================
-- Depth Study — Production hardening (ADDITIVE)
-- Safe to run after the existing database.sql + B2B completion migration.
-- No data deletion. No schema reset.
-- ============================================================================

-- Organization-member metadata is intentionally JSONB so student/faculty
-- provisioning can retain phone/roll/external/batch/department context without
-- changing the core Auth user model.
alter table public.organization_members
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.organization_invites
  add column if not exists context jsonb not null default '{}'::jsonb;

create index if not exists idx_org_members_org_role_status
  on public.organization_members(organization_id, role, status);
create index if not exists idx_org_invites_org_role_status_expiry
  on public.organization_invites(organization_id, role, status, expires_at);
create index if not exists idx_org_usage_org_period
  on public.organization_usage(organization_id, period desc);
create index if not exists idx_org_usage_events_org_created
  on public.organization_usage_events(organization_id, created_at desc);
create index if not exists idx_billing_events_provider_event
  on public.billing_events(provider, provider_event_id);

-- RLS helpers must honor active membership and active tenant status. This makes
-- deactivation/suspension effective even when a caller reaches the database
-- directly rather than through an application route.
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function public.is_org_manager(target_org uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = target_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and o.status = 'active'
      and m.role in ('owner','admin','mentor')
  );
$$;

-- Active org managers only for sensitive billing/audit/import data.
drop policy if exists "org managers read billing profile" on public.organization_billing_profiles;
create policy "org managers read billing profile" on public.organization_billing_profiles
for select using (public.is_org_manager(organization_id) or public.is_admin());

drop policy if exists "org managers read subscription" on public.organization_subscriptions;
create policy "org managers read subscription" on public.organization_subscriptions
for select using (public.is_org_manager(organization_id) or public.is_admin());

drop policy if exists "org managers read invoices" on public.organization_invoices;
create policy "org managers read invoices" on public.organization_invoices
for select using (public.is_org_manager(organization_id) or public.is_admin());

drop policy if exists "org managers read payments" on public.organization_payments;
create policy "org managers read payments" on public.organization_payments
for select using (public.is_org_manager(organization_id) or public.is_admin());

drop policy if exists "org managers read usage" on public.organization_usage;
create policy "org managers read usage" on public.organization_usage
for select using (public.is_org_manager(organization_id) or public.is_admin());

drop policy if exists "org managers read usage events" on public.organization_usage_events;
create policy "org managers read usage events" on public.organization_usage_events
for select using (public.is_org_manager(organization_id) or public.is_admin());

-- Owner invites must remain platform-controlled for first-owner provisioning.
-- Organization owner/admin invites remain governed by the existing management
-- policies.
drop policy if exists "admins manage organization invites" on public.organization_invites;
create policy "admins manage organization invites" on public.organization_invites
for all using (
  public.is_admin()
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_invites.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner','admin')
      and organization_invites.role <> 'owner'
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.organization_members m
    where m.organization_id = organization_invites.organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('owner','admin')
      and organization_invites.role <> 'owner'
  )
);

-- No normal authenticated browser writes to derived billing/usage records.
revoke insert, update, delete on public.organization_subscriptions from anon, authenticated;
revoke insert, update, delete on public.organization_invoices from anon, authenticated;
revoke insert, update, delete on public.organization_invoice_items from anon, authenticated;
revoke insert, update, delete on public.organization_payments from anon, authenticated;
revoke insert, update, delete on public.billing_events from anon, authenticated;
revoke insert, update, delete on public.organization_usage from anon, authenticated;
revoke insert, update, delete on public.organization_usage_events from anon, authenticated;
