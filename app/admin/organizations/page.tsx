import { requireAdmin } from '@/services/auth';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import CreateOrganization from './_components/create-organization';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { Building2, Globe, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function OrganizationsAdmin() {
  await requireAdmin();
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('organizations')
    .select('id,name,slug,kind,status,plan,created_at')
    .order('created_at', { ascending: false });

  const orgs = data ?? [];

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Organizations
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage college and institute workspaces, plans, and access controls.
            </p>
          </div>
        </div>

        {/* Create Organization Form Container */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
          <CreateOrganization />
        </div>

        {/* Organizations Grid */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            All Workspaces ({orgs.length})
          </h2>

          {orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
              <Building2 className="h-8 w-8 text-slate-400 dark:text-slate-600" />
              <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                No organizations found
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Create your first institute or college workspace above.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orgs.map((o: any) => (
                <div
                  key={o.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800/80 dark:bg-[#161b22] dark:hover:border-slate-700"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 line-clamp-1 dark:text-white">
                        {o.name}
                      </h3>
                      <span className="shrink-0 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/50 dark:text-indigo-400">
                        {o.plan || 'Free'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{o.kind || 'Institute'}</span>
                      <span>•</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
                          o.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {o.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-mono text-slate-400 dark:border-slate-800/60 dark:text-slate-500">
                    <span className="flex items-center gap-1 truncate">
                      <Globe size={12} /> /{o.slug}
                    </span>
                    <Link href={`/admin/organizations/${o.id}`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-indigo-500">
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}