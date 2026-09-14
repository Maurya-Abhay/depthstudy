'use client';

import { useParams } from 'next/navigation';
import { 
  CreditCard, 
  Receipt, 
  ShieldAlert, 
  Users, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign 
} from 'lucide-react';
import { 
  PageHeader, 
  Loading, 
  Message, 
  borderCls, 
  useOrgFetch 
} from '../../_components/portal-ui';

type Data = { 
  billing: {
    provider?: string;
    plan?: {
      name: string;
      included_student_seats?: number;
    };
    subscription?: {
      status: string;
      next_billing_date?: string | null;
    };
    usage?: {
      student_seats_used?: number;
      student_seats_included?: number;
      usage_percent?: number;
    };
    currentCharges?: {
      baseAmount: number;
      extraSeats: number;
      extraSeatsAmount?: number;
      taxAmount: number;
      totalAmount: number;
    };
    invoices?: Array<{
      id: string;
      invoice_number: string;
      status: string;
      total_amount: number;
      issue_date?: string | null;
    }>;
    payments?: Array<{
      id: string;
      amount: number;
      status: string;
      provider: string;
      created_at?: string | null;
    }>;
  };
};

export default function BillingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { ctx, data, loading, error } = useOrgFetch<Data>(slug, '/api/organization/billing');

  if (ctx.loading || loading) return <Loading />;
  if (ctx.error || error) return <Message text={ctx.error || error} error />;

  const b = data?.billing;
  const plan = b?.plan;
  const sub = b?.subscription;
  const usage = b?.usage ?? {};
  const charges = b?.currentCharges;
  const invoices = b?.invoices ?? [];
  const payments = b?.payments ?? [];

  const usagePercent = Math.min(usage.usage_percent ?? 0, 100);

  return (
    <div className="space-y-5 font-sans text-xs antialiased">
      {/* Page Header */}
      <PageHeader 
        title="Billing & Usage" 
        subtitle={
          b?.provider === 'none' || !b?.provider 
            ? 'Payment provider not configured' 
            : `Payment Provider: ${b?.provider.toUpperCase()}`
        } 
      />

      {/* Provider Alert Banner */}
      {(b?.provider === 'none' || !b?.provider) && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
          <ShieldAlert size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            No live payment provider is active. Billing records are persisted locally, but automatic charge collection is currently disabled.
          </span>
        </div>
      )}

      {/* Primary Overview Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Plan */}
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subscription Plan</p>
            <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">{plan?.name ?? 'Free Tier'}</p>
          </div>
          <CreditCard size={18} className="text-slate-400" />
        </div>

        {/* Subscription Status */}
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Status</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${sub?.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <p className="text-base font-bold capitalize text-slate-900 dark:text-slate-100">{sub?.status ?? 'Active'}</p>
            </div>
          </div>
          <CheckCircle2 size={18} className="text-emerald-500" />
        </div>

        {/* Seat Usage Progress */}
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Seats Used</p>
            <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-100">
              {usage.student_seats_used ?? 0} <span className="text-xs font-normal text-slate-400">/ {usage.student_seats_included ?? 0}</span>
            </p>
          </div>
          <Users size={18} className="text-indigo-500" />
        </div>

        {/* Usage Allocation Percentage */}
        <div className={`${borderCls} p-3.5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between`}>
          <div className="w-full pr-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capacity Usage</p>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{usagePercent}%</span>
            </div>
            {/* Visual Bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div 
                className={`h-full transition-all duration-300 ${
                  usagePercent > 90 ? 'bg-rose-500' : usagePercent > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                }`} 
                style={{ width: `${usagePercent}%` }} 
              />
            </div>
          </div>
          <TrendingUp size={18} className="text-slate-400 shrink-0" />
        </div>
      </div>

      {/* Current Charges Breakout */}
      {charges && (
        <section className={`${borderCls} p-4 bg-slate-50/30 dark:bg-slate-900/20 space-y-3`}>
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Current Billing Charges</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Real-time estimate for your upcoming billing period.</p>
            </div>
            {sub?.next_billing_date && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar size={12} />
                <span>Next Billing: {new Date(sub.next_billing_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200/60 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Base Subscription</p>
              <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">₹{charges.baseAmount}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Includes {plan?.included_student_seats ?? 0} seats</p>
            </div>

            <div className="rounded-lg border border-slate-200/60 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Extra Seat Add-ons</p>
              <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">+{charges.extraSeats} Seats</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Surcharges based on overage</p>
            </div>

            <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/20">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Total Projected Bill</p>
              <p className="mt-1 text-base font-bold text-indigo-950 dark:text-indigo-200">₹{charges.totalAmount}</p>
              <p className="mt-0.5 text-[10px] text-indigo-700 dark:text-indigo-400">Includes Tax: ₹{charges.taxAmount}</p>
            </div>
          </div>
        </section>
      )}

      {/* Invoices History Section */}
      <section className={`${borderCls} p-4 space-y-3`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Invoices Directory</h2>
          <span className="text-[11px] text-slate-500">{invoices.length} Records</span>
        </div>

        {invoices.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {invoices.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between py-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <div className="flex items-center gap-2.5">
                  <Receipt size={15} className="text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{i.invoice_number}</p>
                    <p className="text-[10px] text-slate-500">
                      Issued: {i.issue_date ? new Date(i.issue_date).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    i.status === 'paid' 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {i.status}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">₹{i.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <Receipt size={24} className="mx-auto mb-1 text-slate-300 dark:text-slate-700" />
            <p>No billing invoices generated yet.</p>
          </div>
        )}
      </section>

      {/* Payment Transactions Section */}
      <section className={`${borderCls} p-4 space-y-3`}>
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 dark:border-slate-800">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">Payment History</h2>
          <span className="text-[11px] text-slate-500">{payments.length} Transactions</span>
        </div>

        {payments.length ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2.5 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                <div className="flex items-center gap-2.5">
                  <DollarSign size={15} className="text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">₹{p.amount}</p>
                    <p className="text-[10px] text-slate-500">
                      Via {p.provider || 'Gateway'} • {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                  p.status === 'succeeded' || p.status === 'completed'
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'succeeded' || p.status === 'completed' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            <CreditCard size={24} className="mx-auto mb-1 text-slate-300 dark:text-slate-700" />
            <p>No processed payment transactions found.</p>
          </div>
        )}
      </section>
    </div>
  );
}