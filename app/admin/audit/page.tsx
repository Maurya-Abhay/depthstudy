import { ScrollText, ShieldCheck, AlertCircle, History, User, Calendar, Code } from 'lucide-react';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { AdminShell } from '@/app/admin/_components/admin-shell';

export default async function AuditPage() {
  const db = createAdminSupabaseClient();
  const { data, error } = await db
    .from('activity_logs')
    .select('id,event_type,entity_type,user_id,metadata,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-5 font-sans text-xs pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Audit Log
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Recent administrator and platform activity, sorted newest first.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 w-fit">
            <History className="w-3 h-3 text-zinc-400" />
            Last 100 Entries
          </span>
        </div>

        {/* Audit Log Content Section */}
        <section className="bg-white dark:bg-[#0d111c] rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
          {error ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <strong className="block text-sm font-bold text-zinc-900 dark:text-white">
                Audit Log Unavailable
              </strong>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                {error.message}
              </p>
            </div>
          ) : data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/80 dark:bg-white/[0.02] border-b border-zinc-200/80 dark:border-white/5 text-zinc-500 dark:text-zinc-400 font-semibold text-[11px]">
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Actor
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Time
                      </span>
                    </th>
                    <th className="py-3 px-4">
                      <span className="flex items-center gap-1">
                        <Code className="w-3 h-3" /> Metadata
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5 text-[11px]">
                  {data.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                        {String(item.event_type).replaceAll('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-white/5">
                          {item.entity_type ?? 'platform'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700">
                          {item.user_id?.slice(0, 8) ?? 'system'}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <code className="bg-zinc-900 dark:bg-zinc-950 text-zinc-300 dark:text-zinc-400 px-2 py-1 rounded text-[10px] font-mono block truncate border border-zinc-800">
                          {JSON.stringify(item.metadata ?? {}).slice(0, 120)}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-400 flex items-center justify-center mx-auto">
                <ScrollText className="w-5 h-5" />
              </div>
              <strong className="block text-sm font-bold text-zinc-900 dark:text-white">
                No Audit Entries Yet
              </strong>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Security and administrator activity will appear here automatically as the workspace is used.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}