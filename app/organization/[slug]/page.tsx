import Link from 'next/link';
import { requireUser } from '@/services/auth';
import { getWorkspaceContext } from '@/services/workspace';
import { getOrganizationMonitoring, getMentorScope } from '@/services/org-monitoring';
import { getUserOrganizationAssignments } from '@/services/organization';
import { 
  Users, 
  GraduationCap, 
  Building, 
  Layers, 
  FileText, 
  BarChart2, 
  Award, 
  ShieldAlert, 
  Calendar,
  ArrowRight,
  BookOpen,
  UserCheck,
  ChevronRight
} from 'lucide-react';

/* Inline Header & Stat Components */
function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-slate-200/80 pb-4 dark:border-slate-800">
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
      {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const ws = await getWorkspaceContext(user.id);
  const match = ws.memberships.find((m) => m.slug === slug);

  if (!match) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <ShieldAlert size={32} className="mb-2 text-rose-500" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Access Denied</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          You do not have permission to view this organization workspace.
        </p>
      </div>
    );
  }

  const isMentor = match.role === 'mentor';
  const isStudent = match.role === 'student';
  
  const monitoring = (isMentor || isStudent) ? null : await getOrganizationMonitoring(match.organization_id);
  const mentor = isMentor ? await getMentorScope(user.id, match.organization_id) : null;
  const studentAssign = isStudent ? (await getUserOrganizationAssignments(user.id)).filter((a: any) => a.organization_id === match.organization_id) : null;

  const cards = isMentor && mentor
    ? [
        { label: 'Assigned Batches', value: mentor.batches.length },
        { label: 'Assigned Students', value: mentor.students.length },
        { label: 'Scope', value: mentor.isBroad ? 'All Batches' : 'Assigned Only' },
      ]
    : [
        { label: 'Students', value: monitoring?.students ?? 0 },
        { label: 'Faculty', value: monitoring?.faculty ?? 0 },
        { label: 'Departments', value: monitoring?.departments ?? 0 },
        { label: 'Batches', value: monitoring?.batches ?? 0 },
        { label: 'Assignments', value: monitoring?.assignments ?? 0 },
        { label: 'Avg Score', value: `${monitoring?.assignmentAvgScore ?? 0}%` },
        { label: 'Placement Readiness', value: `${monitoring?.placement?.readiness_score ?? 0}%` },
      ];

  const managerActions = [
    { href: '/students', label: 'Students', icon: Users },
    { href: '/faculty', label: 'Faculty', icon: GraduationCap },
    { href: '/members', label: 'Members', icon: UserCheck },
    { href: '/departments', label: 'Departments', icon: Building },
    { href: '/batches', label: 'Batches', icon: Layers },
    { href: '/assignments', label: 'Assignments', icon: FileText },
    { href: '/billing', label: 'Billing & Usage', icon: BarChart2 },
    { href: '/audit', label: 'Audit Log', icon: Award },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={match.name} 
        subtitle={`Role: ${match.role.toUpperCase()} · ${match.kind}`} 
      />

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Stat key={c.label} label={c.label} value={c.value} />
        ))}
      </section>

      {isStudent ? (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">My Assignments</h2>
            </div>
            <Link 
              href={`/organization/${slug}/assignments`} 
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {(studentAssign ?? []).length ? (
            <div className="mt-4 space-y-2">
              {(studentAssign ?? []).map((a: any) => (
                <div 
                  key={a.id} 
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 transition-all hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:bg-slate-800/40"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{a.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{a.target_type} · {a.organizations?.name}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <Calendar size={12} />
                    <span>{a.due_at ? new Date(a.due_at).toLocaleDateString() : 'No deadline'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No pending assignments found.
            </div>
          )}
        </section>
      ) : isMentor && mentor ? (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">Assigned Students</h2>
          </div>

          {mentor.students.length ? (
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {mentor.students.map((s) => (
                <div 
                  key={s.user_id} 
                  className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{s.name || s.email}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{s.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              No students assigned to your mentor scope yet.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Management Workspace</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {managerActions.map(({ href, label, icon: Icon }) => (
              <Link 
                key={href} 
                href={`/organization/${slug}${href}`} 
                className="group flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/30 p-3 transition-all hover:border-indigo-500/50 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30 dark:hover:border-indigo-400/50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-slate-500 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-400 transition-colors" />
                  <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">{label}</span>
                </div>
                <ArrowRight size={13} className="text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}