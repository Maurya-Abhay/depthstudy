import Link from 'next/link';
import {
  Award,
  CalendarDays,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Ban,
  ArrowUpRight,
} from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { createServerSupabaseClient } from '@/services/supabase-server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('certificates')
    .select('certificate_code,score,issued_at,revoked_at,courses(title)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  const certificates = data ?? [];
  const activeCount = certificates.filter((item) => !item.revoked_at).length;

  return (
    <UserShell>
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h1 className="text-lg font-black tracking-tight text-blue-950 dark:text-white sm:text-xl">
              My Certificates
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your verified course completions and official earned credentials.
            </p>
          </div>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
            {activeCount} Active Credentials
          </span>
        </div>

        {/* Record Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
              <Award size={20} />
            </span>
            <div>
              <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                {certificates.length}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total Certificates
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={20} />
            </span>
            <div>
              <div className="font-mono text-lg font-black text-slate-900 dark:text-white">
                {activeCount}
              </div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Verified Credentials
              </div>
            </div>
          </div>
        </div>

        {/* Credentials List Panel */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Credential History
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/10 dark:bg-blue-400/10 border border-blue-900/20 px-2.5 py-0.5 text-xs font-bold text-blue-900 dark:text-blue-400">
              <Sparkles size={12} /> {certificates.length} Total Records
            </span>
          </div>

          {certificates.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[420px] overflow-y-auto pr-1">
              {certificates.map((certificate) => {
                const course = Array.isArray(certificate.courses)
                  ? certificate.courses[0]
                  : certificate.courses;
                const isRevoked = Boolean(certificate.revoked_at);

                return (
                  <div
                    key={certificate.certificate_code}
                    className="group flex flex-col gap-3 py-3 transition-colors sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          isRevoked
                            ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isRevoked ? <Ban size={16} /> : <Award size={16} />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-900 dark:group-hover:text-amber-400 transition-colors">
                          {course?.title || 'Course Certificate'}
                        </strong>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} className="text-slate-400" />
                            {new Date(certificate.issued_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            Score: {certificate.score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <Link
                        href={`/dashboard/certificates/${certificate.certificate_code}`}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isRevoked
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-blue-950 text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-400 shadow-sm'
                        }`}
                      >
                        <span>{isRevoked ? 'Revoked' : 'View Certificate'}</span>
                        {isRevoked ? <ChevronRight size={14} /> : <ArrowUpRight size={14} />}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400">
                <Award size={24} />
              </span>
              <strong className="text-sm font-bold text-slate-900 dark:text-white">
                No certificates earned yet
              </strong>
              <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                Complete eligible course modules to automatically earn your official verified credentials.
              </p>
              <Link
                href="/dashboard/courses"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-950 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-900 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
              >
                Browse Available Courses
              </Link>
            </div>
          )}
        </section>
      </div>
    </UserShell>
  );
}