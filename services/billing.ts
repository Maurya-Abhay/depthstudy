import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { getPlanById, getDefaultPlanId } from '@/services/plans';
import { calculateOrganizationInvoice, billingPeriodFor, nextBillingDate } from '@/services/billing-math';
import { getPaymentProvider } from '@/services/payments-provider';
import { getOrganizationFeatureEntitlements } from '@/services/entitlements';

export type MembershipCounts = { students: number; faculty: number; total: number };

export async function countOrganizationMembers(organizationId: string): Promise<MembershipCounts> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('organization_members')
    .select('role,status')
    .eq('organization_id', organizationId);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).filter((r) => r.status !== 'inactive');
  return {
    students: rows.filter((r) => r.role === 'student').length,
    faculty: rows.filter((r) => r.role === 'mentor').length,
    total: rows.length,
  };
}

export async function getCurrentSubscription(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('organization_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/**
 * Produce the persisted snapshot consumed by org/admins' billing dashboard.
 */
export async function getOrganizationBillingSnapshot(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const org = await admin.from('organizations').select('id,name,slug,plan_id,plan,status').eq('id', organizationId).maybeSingle();
  if (!org.data) throw new Error('Organization not found');

  const subscription = await getCurrentSubscription(organizationId);
  const planId = subscription?.plan_id ?? org.data.plan_id;
  let plan = planId ? await getPlanById(planId) : null;
  if (!plan) {
    const defaultId = await getDefaultPlanId();
    plan = defaultId ? await getPlanById(defaultId) : null;
  }

  const counts = await countOrganizationMembers(organizationId);
  const usage = await getUsageSnapshot(organizationId);
  const entitlements = await getOrganizationFeatureEntitlements(organizationId);
  const [invoices, payments] = await Promise.all([listInvoices(organizationId, 10), listPayments(organizationId, 10)]);

  let upcoming = null;
  if (plan) {
    upcoming = calculateOrganizationInvoice({
      plan,
      cycle: subscription?.billing_cycle ?? 'monthly',
      activeStudents: counts.students,
      faculty: counts.faculty,
      taxRate: 0.18,
    });
  }

  const studentSeatsIncluded = plan?.included_student_seats ?? 0;
  return {
    organization: {
      id: org.data.id,
      name: org.data.name,
      slug: org.data.slug,
      status: org.data.status,
      legacy_plan: org.data.plan,
    },
    plan: plan ?? null,
    subscription: subscription ?? null,
    usage: {
      student_seats_used: counts.students,
      student_seats_included: studentSeatsIncluded,
      faculty_seats_used: counts.faculty,
      faculty_seats_included: plan?.included_faculty_seats ?? 0,
      usage_percent: studentSeatsIncluded > 0 ? Math.min(100, Math.round((counts.students / studentSeatsIncluded) * 100)) : 0,
      monthly: usage,
    },
    entitlements: entitlements ?? [],
    currentCharges: upcoming,
    invoices,
    payments,
    provider: getPaymentProvider().name,
  };
}

export async function getUsageSnapshot(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const period = currentPeriod();
  const { data, error } = await admin
    .from('organization_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('period', period)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Create/replace the org subscription. Admin- (platform) or owner/admin-only;
 * callers are expected to authorize before invoking.
 */
export async function saveOrganizationSubscription(organizationId: string, input: { planId?: string; cycle?: 'monthly' | 'yearly'; provider?: string; providerSubscriptionId?: string | null }) {
  const admin = createAdminSupabaseClient();
  const planId = input.planId ?? (await getDefaultPlanId());
  const plan = planId ? await getPlanById(planId) : null;
  const cycle = input.cycle ?? 'monthly';
  const counts = await countOrganizationMembers(organizationId);
  const period = billingPeriodFor(cycle, new Date());
  const now = new Date();

  const payload: Record<string, unknown> = {
    organization_id: organizationId,
    plan_id: planId,
    billing_cycle: cycle,
    billing_model: plan?.billing_model ?? 'per_seat',
    currency: plan?.currency ?? 'INR',
    seat_count: counts.students,
    active_student_count: counts.students,
    faculty_count: counts.faculty,
    billing_period_start: period.start.toISOString(),
    billing_period_end: period.end.toISOString(),
    next_billing_date: nextBillingDate(cycle, now).toISOString(),
    payment_provider: input.provider ?? 'none',
    provider_subscription_id: input.providerSubscriptionId ?? null,
  };

  const { data, error } = await admin
    .from('organization_subscriptions')
    .upsert(payload, { onConflict: 'organization_id,billing_cycle' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}
/**
 * Generate + persist an invoice from live usage. Returns the stored invoice.
 */
export async function generateInvoice(organizationId: string, opts: { cycle?: 'monthly' | 'yearly'; taxRate?: number } = {}) {
  const admin = createAdminSupabaseClient();
  const subscription = await getCurrentSubscription(organizationId);
  const planId = subscription?.plan_id ?? (await getDefaultPlanId());
  const plan = planId ? await getPlanById(planId) : null;
  if (!plan) throw new Error('No plan is configured for this organization.');

  const cycle = opts.cycle ?? subscription?.billing_cycle ?? 'monthly';
  const counts = await countOrganizationMembers(organizationId);
  const calc = calculateOrganizationInvoice({
    plan,
    cycle,
    activeStudents: counts.students,
    faculty: counts.faculty,
    taxRate: opts.taxRate ?? 0.18,
  });
  const period = billingPeriodFor(cycle, new Date());
  const now = new Date();
  const invoiceNumber = `INV-${organizationId.slice(0, 8).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Date.now()}`;

  const { data: invoice, error } = await admin
    .from('organization_invoices')
    .insert({
      organization_id: organizationId,
      subscription_id: subscription?.id,
      invoice_number: invoiceNumber,
      status: 'issued',
      currency: plan.currency ?? 'INR',
      base_amount: calc.baseAmount,
      seat_count: counts.students,
      extra_seats: calc.extraSeats,
      faculty_count: counts.faculty,
      extra_faculty: calc.extraFaculties,
      extra_seat_charge: calc.extraSeatCharge,
      extra_faculty_charge: calc.extraFacultyCharge,
      tax_amount: calc.taxAmount,
      total_amount: calc.totalAmount,
      billing_period_start: period.start.toISOString(),
      billing_period_end: period.end.toISOString(),
      issue_date: now.toISOString(),
      due_date: addDays(now, 14).toISOString(),
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  const items = calc.lines.map((line) => ({
    invoice_id: invoice.id,
    kind: line.kind,
    description: line.description,
    quantity: line.quantity,
    unit_amount: line.unitAmount,
    amount: line.amount,
  }));
  if (items.length) {
    const { error: itemError } = await admin.from('organization_invoice_items').insert(items);
    if (itemError) throw new Error(itemError.message);
  }
  return invoice;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export async function listInvoices(organizationId: string, limit = 50) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('organization_invoices')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listPayments(organizationId: string, limit = 50) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('organization_payments')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}
/**
 * Record a payment idempotently. The unique `idempotency_key` prevents
 * duplicate records from retries/duplicate webhooks. Never marks an invoice
 * paid from the browser — this runs server-side from provider events/reconciliation.
 */
export async function recordPayment(organizationId: string, payment: {
  invoiceId?: string | null;
  amount: number;
  currency: string;
  provider: string;
  providerPaymentId?: string | null;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  failureReason?: string | null;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('organization_payments')
    .upsert(
      {
        organization_id: organizationId,
        invoice_id: payment.invoiceId ?? null,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        provider_payment_id: payment.providerPaymentId ?? null,
        status: payment.status,
        paid_at: payment.status === 'succeeded' ? new Date().toISOString() : null,
        failure_reason: payment.failureReason ?? null,
        idempotency_key: payment.idempotencyKey ?? `${organizationId}:${Date.now()}`,
        metadata: payment.metadata ?? {},
      },
      { onConflict: 'idempotency_key' },
    )
    .select('*')
    .single();
  if (error) throw new Error(error.message);

  if (payment.status === 'succeeded' && payment.invoiceId && data) {
    await admin.from('organization_invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payment.invoiceId);
  }
  return data;
}

/**
 * Idempotent webhook ingest. Duplicate provider events are flagged, not replayed.
 */
export async function ingestBillingEvent(input: {
  organizationId?: string | null;
  provider: string;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const admin = createAdminSupabaseClient();
  const existing = await admin
    .from('billing_events')
    .select('id,process_status')
    .eq('provider', input.provider)
    .eq('provider_event_id', input.providerEventId)
    .maybeSingle();
  if (existing.data) {
    if (existing.data.process_status === 'duplicate') return { duplicate: true, id: existing.data.id };
    return { duplicate: false, id: existing.data.id };
  }
  const { data, error } = await admin
    .from('billing_events')
    .insert({
      organization_id: input.organizationId ?? null,
      provider: input.provider,
      provider_event_id: input.providerEventId,
      event_type: input.eventType,
      payload: input.payload,
      process_status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return { duplicate: false, id: data.id };
}