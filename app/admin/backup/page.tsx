import { DatabaseBackup, Download, ShieldCheck, HardDrive, Info } from 'lucide-react';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { BackupDownload } from '@/app/admin/_components/backup-download';

export default function BackupPage() {
  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-5 font-sans text-xs pb-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Database Backup
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Export and safeguard system data, progress records, and system settings.
            </p>
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Action Card */}
          <section className="lg:col-span-2 bg-white dark:bg-[#0d111c] p-6 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                <DatabaseBackup size={24} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  Export Current Database
                </h2>
                <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
                  The backup includes content, course links, learner progress, notes, assessments, DSA data, and activity logs. Authentication secrets are never included.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <BackupDownload />
            </div>
          </section>

          {/* Info Sidebar */}
          <aside className="space-y-3">
            <div className="bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-zinc-900 dark:text-white block">
                    Admin Access Only
                  </strong>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-normal">
                    Only authorized admin accounts are permitted to generate and download system backups.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 shrink-0">
                  <Download size={18} />
                </div>
                <div className="space-y-0.5">
                  <strong className="text-xs font-bold text-zinc-900 dark:text-white block">
                    JSON Data Format
                  </strong>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-normal">
                    Data is exported as structured JSON. Store the downloaded file in a secure location.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-tight">
                Regularly scheduled backups help prevent accidental data loss during system updates.
              </span>
            </div>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}