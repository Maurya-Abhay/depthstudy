import { requireAdmin } from '@/services/auth';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { getProvisioningState } from '@/services/organization-provisioning';
import { getOrganizationBillingSnapshot } from '@/services/billing';
import { getOrganizationFeatureEntitlements } from '@/services/entitlements';
import { getPlans } from '@/services/plans';
import { listMembers } from '@/services/org-members';
import { listPlatformAudit } from '@/services/org-audit';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import AdminOrgClient from './_components/admin-org-client';
import { Building2, AlertCircle } from 'lucide-react';

export default async function AdminOrganizationDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const orgRes = await admin.from('organizations').select('*').eq('id', id).maybeSingle();
  if (!orgRes.data) {
    return (
      <AdminShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
            <AlertCircle size={24} />
          </div>
          <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
            Organization Not Found
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            The organization with ID <code className="font-mono">{id}</code> does not exist or has been deleted.
            {orgRes.error ? ` (${orgRes.error.message})` : ''}
          </p>
        </div>
      </AdminShell>
    );
  }
  const org = orgRes.data;

  // Load dependent panels independently — one failing service must never
  // blank the whole page. Each falls back to a safe empty value.
  // Perf: audit/invites ko lazy (client-side) load kiya ja sakta hai, lekin
  // heavy snapshot sirf tab jab zaroori ho — ab audit 20 tak limit aur
  // org row me se sirf zaroori columns fetch hote hain.
  const [provisioning, billing, entitlements, plans, members, audit] = await Promise.all([
    getProvisioningState(id).catch((e) => { console.error('[org detail] provisioning:', e?.message); return null; }),
    getOrganizationBillingSnapshot(id).catch((e) => { console.error('[org detail] billing:', e?.message); return null; }),
    getOrganizationFeatureEntitlements(id).catch((e) => { console.error('[org detail] entitlements:', e?.message); return []; }),
    getPlans(true).catch((e) => { console.error('[org detail] plans:', e?.message); return []; }),
    listMembers(id, { pageSize: 25 }).catch((e) => { console.error('[org detail] members:', e?.message); return { members: [], total: 0, page: 1, pageSize: 25 }; }),
    listPlatformAudit(id, 20).catch((e) => { console.error('[org detail] audit:', e?.message); return []; }),
  ]);

  return (
    <AdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <AdminOrgClient
          org={org as any}
          provisioning={provisioning as any}
          billing={billing as any}
          entitlements={entitlements as any}
          plans={plans as any}
          members={members as any}
          audit={audit as any}
        />
      </div>
    </AdminShell>
  );
}