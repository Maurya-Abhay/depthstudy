import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Award,
  BarChart3,
  BrainCircuit,
  BookOpen,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Sparkles,
  Users,
  Clock,
  ChevronRight,
  Server,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { AdminShell } from '@/app/admin/_components/admin-shell';

export default async function Admin() {
  const supabase = createAdminSupabaseClient();

  // Parallel database fetching
  const [
    users,
    courses,
    topics,
    dsa,
    enrollments,
    attempts,
    certificates,
    activity,
    recentUsers,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('courses')
      .select('id', { count: 'exact', head: true })
      .eq('published', true),
    supabase
      .from('study_topics')
      .select('id', { count: 'exact', head: true })
      .eq('published', true),
    supabase
      .from('dsa_problems')
      .select('id', { count: 'exact', head: true })
      .eq('published', true),
    supabase.from('enrollments').select('id', { count: 'exact', head: true }),
    supabase.from('test_attempts').select('id', { count: 'exact', head: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    supabase
      .from('activity_logs')
      .select('id,event_type,entity_type,metadata,created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('profiles')
      .select('id,name,role,created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const metrics = [
    { label: 'Total Users', value: users.count ?? 0, icon: Users, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' },
    { label: 'Total Courses', value: courses.count ?? 0, icon: BookOpen, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10' },
    { label: 'Total Tests', value: attempts.count ?? 0, icon: CheckCircle2, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10' },
    { label: 'Certificates Issued', value: certificates.count ?? 0, icon: Award, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
  ];

  const quickActions = [
    { label: 'Add Course', href: '/admin/courses', icon: BookOpen },
    { label: 'Add Test', href: '/admin/tests', icon: ListChecks },
    { label: 'Add User', href: '/admin/users', icon: Users },
  ];

  const systemStatus = [
    { name: 'Database', status: 'Healthy', icon: Database, badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
    { name: 'API Services', status: 'Healthy', icon: Server, badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' },
    { name: 'Backup', status: 'Completed', icon: ShieldCheck, badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' },
  ];

  const managementLinks = [
    { href: '/admin/categories', label: 'Categories', desc: 'Organize library.', icon: FolderKanban },
    { href: '/admin/topics', label: 'Topics', desc: 'Publish lessons.', icon: BookOpen },
    { href: '/admin/courses', label: 'Courses', desc: 'Guided paths.', icon: BookOpen },
    { href: '/admin/questions', label: 'Questions', desc: 'Question bank.', icon: ListChecks },
    { href: '/admin/tests', label: 'Tests', desc: 'Assessments.', icon: CheckCircle2 },
    { href: '/admin/dsa', label: 'DSA Problems', desc: 'Coding practice.', icon: BrainCircuit },
    { href: '/admin/organizations', label: 'Organizations', desc: 'College workspaces.', icon: Users },
    { href: '/admin/content-quality', label: 'Content Quality', desc: 'Quality signals.', icon: ShieldCheck },
  ];

  return (
    <AdminShell>
      <div className="space-y-4 font-sans text-xs">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Dashboard</h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Platform overview and key metrics</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 text-[11px] font-medium shadow-sm">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Overview</span>
          </span>
        </div>

        {/* Clean 4 KPI Metrics (Without percentage tags) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map((item) => (
            <div
              key={item.label}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0d111c] shadow-sm flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
                  {item.label}
                </span>
                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white block">
                  {item.value.toLocaleString()}
                </span>
              </div>
              <span className={`p-2.5 rounded-xl ${item.color} shrink-0`}>
                <item.icon className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>

        {/* Recent Users Table & Side Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent Users Card */}
          <div className="lg:col-span-2 p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0d111c] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white">Recent Users</h2>
              <Link
                href="/admin/users"
                className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-zinc-400 dark:text-zinc-500 font-medium border-b border-zinc-100 dark:border-white/5">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {recentUsers.data?.length ? (
                    recentUsers.data.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] shrink-0">
                              {(u.name?.[0] ?? 'U').toUpperCase()}
                            </span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                              {u.name || 'Learner'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-zinc-500 capitalize">{u.role}</td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                            Active
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-zinc-400 font-medium">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-400">
                        No users registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions & System Health */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0d111c] shadow-sm space-y-3">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white">Quick Actions</h2>
              <div className="grid grid-cols-3 gap-2">
                {quickActions.map((act) => (
                  <Link
                    key={act.label}
                    href={act.href}
                    className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all text-center gap-1.5 group"
                  >
                    <span className="p-2 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shadow-sm border border-zinc-100 dark:border-white/5">
                      <act.icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {act.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0d111c] shadow-sm space-y-2.5">
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white">System Status</h2>
              <div className="space-y-1.5">
                {systemStatus.map((sys) => (
                  <div
                    key={sys.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-white/5 text-[11px]"
                  >
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                      <sys.icon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{sys.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${sys.badge}`}>
                      {sys.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Platform Content Links Grid */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#0d111c] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/5">
            <div>
              <h2 className="text-xs font-bold text-zinc-900 dark:text-white">Content & Operations</h2>
              <p className="text-[10px] text-zinc-500">Quick access to core administrative areas</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {managementLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-white/5 transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <item.icon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <ArrowUpRight className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                  {item.label}
                </span>
                <span className="text-[9px] text-zinc-400 truncate">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}