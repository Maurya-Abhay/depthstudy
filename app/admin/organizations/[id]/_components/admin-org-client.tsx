'use client';

import { useState } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import {
  Building2,
  Users,
  CreditCard,
  Settings,
  ShieldAlert,
  History,
  Check,
  X,
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

type Props = {
  org: any;
  provisioning: any;
  billing: any;
  entitlements: any[];
  plans: any[];
  members: any;
  audit: any[];
};

const svcLabels: Record<string, string> = {
  courses: 'Courses',
  tests: 'Tests',
  dsa: 'DSA',
  ai_coach: 'AI Coach',
  projects: 'Projects',
  mock_interviews: 'Mock Interviews',
  placement_analytics: 'Placement Analytics',
  certificates: 'Certificates',
  advanced_analytics: 'Advanced Analytics',
};

const getStepLabel = (n: number) =>
  [
    'Organization',
    'Plan',
    'Services',
    'Billing',
    'First Owner',
    'Departments',
    'Batches',
    'Faculty',
    'Students',
    'Review',
    'Finish',
  ][Math.min(n, 11) - 1] ?? `Step ${n}`;

export default function AdminOrgClient({
  org,
  provisioning,
  billing,
  entitlements,
  plans,
  members,
  audit,
}: Props) {
  const confirm = useConfirm();
  const [tab, setTab] = useState('overview');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; e: boolean } | null>(null);

  // Form states replacing direct DOM lookups
  const [selectedPlan, setSelectedPlan] = useState(billing?.plan?.id ?? '');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [pwdFor, setPwdFor] = useState('');
  const [pwdValue, setPwdValue] = useState('');

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/organizations/${org.id}/provisioning`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? 'Failed operation');
      setMsg({ t: 'Changes saved successfully.', e: false });
      return d;
    } catch (e) {
      setMsg({ t: e instanceof Error ? e.message : 'Operation failed', e: true });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function suspend() {
    if (
      !(await confirm({
        title: 'Suspend Organization?',
        message: 'Access for this organization will be blocked immediately. No data is deleted.',
        confirmLabel: 'Suspend Workspace',
        danger: true,
      }))
    )
      return;
    await run('suspend');
  }

  async function resume() {
    if (
      !(await confirm({
        title: 'Resume Organization?',
        message: 'Access will be restored for all active users in this organization.',
        confirmLabel: 'Resume Access',
      }))
    )
      return;
    await run('resume');
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'details', label: 'All Details', icon: Building2 },
    { id: 'access', label: 'Owner & Access', icon: UserPlus },
    { id: 'plan-services', label: 'Plan & Services', icon: Settings },
    { id: 'provisioning', label: 'Setup Wizard', icon: CheckCircle2 },
    { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'audit', label: 'Audit Log', icon: History },
  ];

  const usage = billing?.usage ?? {};
  const membersList = members?.members ?? [];
  const membersByRole = membersList.reduce((a: Record<string, number>, m: any) => {
    a[m.role] = (a[m.role] ?? 0) + 1;
    return a;
  }, {});
  const setupPct = provisioning
    ? Math.round(((provisioning.completed_steps ?? []).length / (provisioning.total_steps || 11)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {org.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                org.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              }`}
            >
              {org.status}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="font-mono text-slate-600 dark:text-slate-300">/{org.slug}</span>
            <span>•</span>
            <span className="capitalize">{org.kind || 'Institute'}</span>
            <span>•</span>
            <span>Created {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}</span>
            <span>•</span>
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
              {org.plan || billing?.plan?.name || 'Free'} Plan
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {org.status === 'active' ? (
            <button
              disabled={busy}
              onClick={suspend}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-rose-500 active:scale-95 disabled:opacity-50"
            >
              <ShieldAlert size={14} />
              <span>Suspend Workspace</span>
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={resume}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={14} />
              <span>Resume Workspace</span>
            </button>
          )}
        </div>
      </header>

      {/* Notification Banner */}
      {msg && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
            msg.e
              ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400'
          }`}
        >
          {msg.e ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{msg.t}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-slate-200/80 dark:border-slate-800/80">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold transition-all ${
              tab === id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {tab === 'overview' && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Owners', membersByRole.owner ?? 0],
            ['Admins', membersByRole.admin ?? 0],
            ['Mentors', membersByRole.mentor ?? 0],
            ['Students', membersByRole.student ?? 0],
            ['Student Seats', `${usage.student_seats_used ?? 0} / ${usage.student_seats_included ?? 0}`],
            ['Faculty Seats', `${usage.faculty_seats_used ?? 0} / ${usage.faculty_seats_included ?? 0}`],
            ['Subscription Status', billing?.subscription?.status ?? '—'],
            ['Setup Completion', `${setupPct}%`],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]"
            >
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
            </div>
          ))}
        </section>
      )}

      {/* TAB: ALL DETAILS */}
      {tab === 'details' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Organization — all details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['Organization ID', org.id],
                ['Name', org.name],
                ['Slug', `/${org.slug}`],
                ['Kind', org.kind],
                ['Status', org.status],
                ['Plan', org.plan],
                ['Legal Name', org.legal_name],
                ['Official Email', org.official_email],
                ['Phone', org.phone],
                ['Website', org.website],
                ['Address', org.address],
                ['City', org.city],
                ['State', org.state],
                ['Country', org.country],
                ['Postal Code', org.postal_code],
                ['Contact Person', org.contact_person],
                ['Notes', org.notes],
                ['Created At', org.created_at ? new Date(org.created_at).toLocaleString() : null],
              ] as [string, string | null][]).map(([l, v]) => (
                <div key={l} className="rounded-xl border border-slate-200/80 p-3 dark:border-slate-800/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{l}</div>
                  <div className="mt-1 break-words text-xs font-semibold text-slate-900 dark:text-slate-100">{v ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: PLAN & SERVICES */}
      {tab === 'plan-services' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Plan Configuration</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Current: <strong className="text-slate-800 dark:text-slate-200">{billing?.plan?.name ?? '—'}</strong> ({billing?.plan?.billing_model ?? 'per_seat'}) · ₹{billing?.plan?.monthly_price ?? 0}/mo · {billing?.plan?.included_student_seats ?? 0} included seats
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="" disabled>Select plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>

              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="monthly">Monthly Cycle</option>
                <option value="yearly">Yearly Cycle</option>
              </select>

              <button
                disabled={busy || !selectedPlan}
                onClick={() => run('set_subscription', { planId: selectedPlan, cycle: billingCycle })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : 'Save Plan'}
              </button>

              <button
                disabled={busy}
                onClick={() => run('generate_invoice', { cycle: billingCycle })}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Generate Invoice
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Services & Feature Entitlements</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Toggle service modules and feature availability for this tenant.</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {entitlements.map((e) => (
                <div
                  key={e.service}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 p-3 dark:border-slate-800/80"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {svcLabels[e.service] ?? e.service}
                    </div>
                    {e.quota != null && (
                      <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        Quota: {e.quota} {e.quota_unit ?? ''}
                      </div>
                    )}
                  </div>

                  <button
                    disabled={busy}
                    onClick={() => run('set_service', { service: e.service, enabled: !e.enabled })}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
                      e.enabled
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {e.enabled ? <Check size={12} /> : <X size={12} />}
                    <span>{e.enabled ? 'Enabled' : 'Disabled'}</span>
                  </button>
                </div>
              ))}
              {!entitlements.length && (
                <div className="col-span-full py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  No service entitlement records configured yet.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: PROVISIONING */}
      {tab === 'provisioning' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Setup Wizard Progress</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Status: <strong className="capitalize text-slate-800 dark:text-slate-200">{provisioning?.status ?? '—'}</strong> · Step {provisioning?.current_step ?? 1} of {provisioning?.total_steps ?? 11} ({setupPct}% complete)
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 11 }, (_, i) => i + 1).map((n) => {
                const done = (provisioning?.completed_steps ?? []).includes(n);
                return (
                  <div
                    key={n}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${
                      done
                        ? 'border border-emerald-200/80 bg-emerald-50/60 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border border-slate-200/60 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400'
                    }`}
                  >
                    <span>{getStepLabel(n)}</span>
                    {done ? <Check size={14} className="shrink-0" /> : <span className="text-[10px] opacity-60">Step {n}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Owner Setup</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Owner banane ke liye <strong>Owner &amp; Access</strong> tab use karo — wahan direct email + password se account banta hai. Invite flow hata diya gaya hai.
            </p>
          </div>
        </section>
      )}

      {/* TAB: OWNER & ACCESS */}
      {tab === 'access' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Owner Login — email + password</h2>
            <p className="mt-1 text-xs text-slate-500">Owner account banao + password set karo. Wo turant /login se login karega. (Invite flow hataya ja chuka hai.)</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="Owner name" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
              <input value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="owner@college.edu" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
              <input value={newOwnerPassword} onChange={(e) => setNewOwnerPassword(e.target.value)} type="password" placeholder="Password (min 8)" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
            </div>
            <button disabled={busy || !newOwnerEmail || newOwnerPassword.length < 8} onClick={async () => { const d = await run('create_owner_account', { name: newOwnerName, email: newOwnerEmail, password: newOwnerPassword }); if (d) { setNewOwnerPassword(''); setMsg({ t: `Owner ready. Login: ${newOwnerEmail}`, e: false }); } }} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}<span>Create owner + set password</span>
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Members — email + password reset</h2>
            <div className="mt-3 space-y-2">
              {membersList.length ? membersList.map((m: any) => (
                <div key={m.user_id} className="rounded-xl border border-slate-200/80 p-3 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs"><span className="font-bold">{m.name || '—'}</span><span className="ml-2 font-mono text-slate-500">{m.email || '(no email)'}</span><span className="ml-2 capitalize text-slate-500">{m.role} · {m.status}</span></div>
                    <div className="flex gap-2">
                      <button disabled={busy} onClick={() => setPwdFor(pwdFor === m.user_id ? '' : m.user_id)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold">Set password</button>
                      <button disabled={busy} onClick={() => run('send_reset_link', { memberUserId: m.user_id })} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[10px] font-bold">Reset link</button>
                    </div>
                  </div>
                  {pwdFor === m.user_id && (
                    <div className="mt-2 flex gap-2">
                      <input value={pwdValue} onChange={(e) => setPwdValue(e.target.value)} type="password" placeholder="Naya password (min 8)" className="w-full rounded-xl border px-3 py-1.5 text-xs" />
                      <button disabled={busy || pwdValue.length < 8} onClick={async () => { const d = await run('set_member_password', { memberUserId: m.user_id, password: pwdValue }); if (d) { setPwdFor(''); setPwdValue(''); } }} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">Save</button>
                    </div>
                  )}
                </div>
              )) : (<p className="text-xs text-slate-500">Abhi koi member nahi — upar se owner banao.</p>)}
            </div>
          </div>
        </section>
      )}


      {/* TAB 4: BILLING */}
      {tab === 'billing' && (
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Seat Usage Metrics</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ['Active Student Seats', `${usage.student_seats_used ?? 0} / ${usage.student_seats_included ?? 0}`],
                ['Active Faculty Seats', `${usage.faculty_seats_used ?? 0} / ${usage.faculty_seats_included ?? 0}`],
                ['Capacity Usage Rate', `${usage.usage_percent ?? 0}%`],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl border border-slate-200/80 p-3.5 dark:border-slate-800/80">
                  <div className="text-xs text-slate-500 dark:text-slate-400">{l}</div>
                  <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{v}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Billing Provider: <strong className="text-slate-700 dark:text-slate-300">{billing?.provider ?? 'manual'}</strong> · Next renewal: {billing?.subscription?.next_billing_date ? new Date(billing.subscription.next_billing_date).toLocaleDateString() : '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Invoices & Statements</h2>
            {(billing?.invoices ?? []).length ? (
              <div className="mt-3 space-y-2">
                {billing.invoices.map((i: any) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 px-4 py-3 dark:border-slate-800/80"
                  >
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {i.invoice_number}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                        {i.status} · ₹{i.total_amount}
                      </span>
                      <ExternalLink size={14} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No invoices generated for this organization yet.</p>
            )}
          </div>
        </section>
      )}

      {/* TAB 5: MEMBERS */}
      {tab === 'members' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
                  <th className="px-4 py-3.5">Member</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {membersList.length ? (
                  membersList.map((m: any) => (
                    <tr key={m.user_id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-200">
                        {m.name || m.email}
                      </td>
                      <td className="px-4 py-3 font-medium capitalize text-slate-600 dark:text-slate-400">
                        {m.role}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {m.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No members assigned to this organization.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT */}
      {tab === 'audit' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Platform Security Audit Records
          </h2>
          {audit.length ? (
            <div className="space-y-2">
              {audit.map((e: any) => (
                <div
                  key={e.id}
                  className="flex flex-col gap-1 rounded-xl border border-slate-200/80 p-3 text-xs dark:border-slate-800/80"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-200">
                      {e.action}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    By: <span className="font-semibold">{e.actor?.name || 'System Operator'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">No recent audit log events available.</p>
          )}
        </div>
      )}
    </div>
  );
}