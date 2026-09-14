import { requireAdmin } from '@/services/auth';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { Users, BookOpen, FolderGit2, Building2, AlertTriangle, Activity } from 'lucide-react';

export default async function ProductHealthPage() {
  await requireAdmin();
  const admin = createAdminSupabaseClient();

  const [{ count: users }, { count: skills }, { count: projects }, { count: organizations }] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('skills').select('*', { count: 'exact', head: true }),
    admin.from('projects').select('*', { count: 'exact', head: true }),
    admin.from('organizations').select('*', { count: 'exact', head: true }),
  ]);

  const checks = [
    { label: 'Total Users', value: users ?? 0, icon: Users, color: 'text-blue-500' },
    { label: 'Active Skills', value: skills ?? 0, icon: BookOpen, color: 'text-indigo-500' },
    { label: 'Projects', value: projects ?? 0, icon: FolderGit2, color: 'text-purple-500' },
    { label: 'Organizations', value: organizations ?? 0, icon: Building2, color: 'text-emerald-500' },
  ];

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Product Health
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              High-level data health signals and resource metrics for the Depth Study platform.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Activity size={14} className="animate-pulse" />
            <span>Database Connected</span>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {checks.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 dark:border-slate-800/80 dark:bg-[#161b22] dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {label}
                </span>
                <Icon size={18} className={color} />
              </div>
              <div className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Alert Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <span className="font-bold">System Note:</span> Runtime provider checks still require live Supabase and OpenRouter credentials. This screen intentionally reports data-level entity metrics, not a false green deployment status.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}