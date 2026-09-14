import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Users,
  Award,
  Code2,
  TrendingUp,
  Activity,
  LineChart,
} from 'lucide-react';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { AdminShell } from '@/app/admin/_components/admin-shell';

export default async function AnalyticsPage() {
  const db = createAdminSupabaseClient();
  const [
    users,
    enrollments,
    topics,
    courses,
    attempts,
    passed,
    certificates,
    dsaAccepted,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('enrollments').select('id', { count: 'exact', head: true }),
    db.from('study_topics').select('id', { count: 'exact', head: true }).eq('published', true),
    db.from('courses').select('id', { count: 'exact', head: true }).eq('published', true),
    db.from('test_attempts').select('id', { count: 'exact', head: true }).not('submitted_at', 'is', null),
    db.from('test_attempts').select('id', { count: 'exact', head: true }).eq('passed', true).not('submitted_at', 'is', null),
    db.from('certificates').select('id', { count: 'exact', head: true }),
    db.from('dsa_submissions').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
  ]);

  const passRate = attempts.count
    ? Math.round(((passed.count ?? 0) / attempts.count) * 100)
    : 0;

  const metrics = [
    { label: 'Total Users', value: users.count ?? 0, icon: Users, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' },
    { label: 'Course Enrollments', value: enrollments.count ?? 0, icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
    { label: 'Published Topics', value: topics.count ?? 0, icon: Code2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
    { label: 'Published Courses', value: courses.count ?? 0, icon: BookOpen, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-100 dark:border-cyan-500/20' },
    { label: 'Test Attempts', value: attempts.count ?? 0, icon: CheckCircle2, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
    { label: 'Test Pass Rate', value: `${passRate}%`, icon: BarChart3, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20' },
    { label: 'Issued Certificates', value: certificates.count ?? 0, icon: Award, color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-100 dark:border-yellow-500/20' },
    { label: 'DSA Accepted', value: dsaAccepted.count ?? 0, icon: Code2, color: 'text-teal-500 bg-teal-50 dark:bg-teal-500/10 border-teal-100 dark:border-teal-500/20' },
  ];

  return (
    <AdminShell>
      <div className="max-w-7xl mx-auto space-y-6 font-sans text-xs pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              System Analytics
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              A clean operational view of learning activity, test outcomes, and total participation.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Counters
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white dark:bg-[#0d111c] p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-0.5 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {label}
                </span>
                <div className={`p-2 rounded-lg border ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Measurement Plan Card */}
        <section className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-2">
          
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <LineChart className="w-4 h-4 text-indigo-500" />
            Trend Analytics
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-[11px]">
            Daily active learners, course completion rates, retention metrics, AI usage stats, and DSA submission trend graphs require event aggregation beyond these live operational counters.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}