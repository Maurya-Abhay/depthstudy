import {
  Award,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  Mail,
  ShieldCheck,
  Users,
  UserCheck,
} from 'lucide-react';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { AdminProfileEdit } from '@/app/admin/_components/admin-profile-edit';
import { requireAdmin } from '@/services/auth';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

export default async function AdminProfilePage() {
  const user = await requireAdmin();
  const db = createAdminSupabaseClient();

  const { data: profile } = await db
    .from('profiles')
    .select('name, role, status, created_at')
    .eq('id', user.id)
    .maybeSingle();

  const displayName = profile?.name || user.email?.split('@')[0] || 'Administrator';
  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-6 font-sans text-xs pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Admin Profile
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Manage the administrator identity used across the control center.
            </p>
          </div>
          <AdminProfileEdit currentName={displayName} />
        </div>

        {/* Profile Hero Card */}
        <section className="bg-white dark:bg-[#0d111c] p-6 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-md border-2 border-indigo-100 dark:border-indigo-500/20">
              {initials || 'A'}
            </div>

            {/* Identity Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Active Administrator
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                <Mail className="w-3.5 h-3.5" />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-zinc-400 pt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Joined{' '}
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Not available'}
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <ShieldCheck className="w-3 h-3" /> Status: {profile?.status || 'active'}
                </span>
              </div>
            </div>
          </div>

          {/* Level / Access Progress Indicator */}
          <div className="w-full md:w-56 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400">Platform Access</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">Full Control</strong>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-full rounded-full" />
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Content, users, assessments and settings.
            </p>
          </div>
        </section>

        {/* Metrics Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#0d111c] p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                ADMIN
              </strong>
              <span className="text-[10px] text-zinc-400">Account Role</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d111c] p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                FULL
              </strong>
              <span className="text-[10px] text-zinc-400">Platform Access</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d111c] p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                ACTIVE
              </strong>
              <span className="text-[10px] text-zinc-400">Account Status</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0d111c] p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                SECURE
              </strong>
              <span className="text-[10px] text-zinc-400">Protected Account</span>
            </div>
          </div>
        </section>

        {/* Identity Details Card */}
        <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/5">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Control-Center Account
              </h2>
            </div>
            <CircleUserRound className="w-5 h-5 text-zinc-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-400 block font-medium">Display Name</span>
              <strong className="text-xs text-zinc-900 dark:text-white font-semibold">
                {displayName}
              </strong>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-white/5 space-y-1">
              <span className="text-[10px] text-zinc-400 block font-medium">Email Address</span>
              <strong className="text-xs text-zinc-900 dark:text-white font-semibold">
                {user.email}
              </strong>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}