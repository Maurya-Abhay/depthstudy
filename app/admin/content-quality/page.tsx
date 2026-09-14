import { requireAdmin } from '@/services/auth';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { Sparkles, ShieldAlert, FileSearch, ArrowUpDown } from 'lucide-react';

export default async function ContentQualityPage() {
  await requireAdmin();
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('content_quality_metrics')
    .select('*')
    .order('quality_score', { ascending: true })
    .limit(100);

  const rows = data ?? [];

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-5 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              Content Quality Audits
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Identify low-performing content metrics driven by learner outcomes and flag reports.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Sparkles size={14} className="text-indigo-500" />
            <span>Showing lowest quality scores</span>
          </div>
        </div>

        {/* Table Data View */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#161b22]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/40 dark:text-slate-400">
                  <th className="px-4 py-3.5">Content Type</th>
                  <th className="px-4 py-3.5">Content ID</th>
                  <th className="px-4 py-3.5">Attempts</th>
                  <th className="px-4 py-3.5">Success Rate</th>
                  <th className="px-4 py-3.5">Reports</th>
                  <th className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1">
                      Quality Score <ArrowUpDown size={12} />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileSearch className="h-8 w-8 text-slate-400 dark:text-slate-600" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          No quality metric records found
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Content quality metrics will automatically refresh as learners interact with modules.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((r: any) => {
                    const successRate = r.attempts > 0 
                      ? Math.round((r.successful_attempts / r.attempts) * 100) 
                      : 0;

                    return (
                      <tr
                        key={`${r.content_type}-${r.content_id}`}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900 capitalize dark:text-slate-200">
                          {r.content_type}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {r.content_id}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                          {r.attempts}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                          {successRate}%
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {r.report_count > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                              <ShieldAlert size={12} /> {r.report_count}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              r.quality_score < 60
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : r.quality_score < 80
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {r.quality_score}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}