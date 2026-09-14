import Link from 'next/link';
import { requireUser } from '@/services/auth';
import { getWorkspaceContext } from '@/services/workspace';
import OrgShell from '../_components/org-shell';
import StudentShell from './_components/student-shell';
import { ShieldAlert, UserX, Building2, ArrowLeft } from 'lucide-react';

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const ws = await getWorkspaceContext(user.id);
  const match = ws.memberships.find((m) => m.slug === slug);

  /* 1. Access Denied State */
  if (!match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-xs antialiased dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-xl border border-slate-200/80 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <ShieldAlert size={20} />
          </div>
          <h1 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Access Denied</h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            You are not a member of this workspace. Please select an organization associated with your account.
          </p>
          <Link
            href="/organization"
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500"
          >
            <ArrowLeft size={14} />
            <span>View Workspaces</span>
          </Link>
        </div>
      </main>
    );
  }

  /* 2. Inactive Member State */
  if (match.member_status !== 'active') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-xs antialiased dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <UserX size={20} />
          </div>
          <h1 className="mt-3 text-base font-bold text-amber-900 dark:text-amber-200">Membership Inactive</h1>
          <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
            Your account membership in this organization is deactivated. Contact an admin to restore access.
          </p>
          <Link
            href="/organization"
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-sm transition-all hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-900/60 dark:text-amber-200 dark:hover:bg-amber-900"
          >
            <ArrowLeft size={14} />
            <span>Back to Workspaces</span>
          </Link>
        </div>
      </main>
    );
  }

  /* 3. Suspended Organization State */
  if (match.org_status !== 'active') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans text-xs antialiased dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-rose-50/80 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
            <Building2 size={20} />
          </div>
          <h1 className="mt-3 text-base font-bold text-rose-900 dark:text-rose-200">Organization Suspended</h1>
          <p className="mt-1.5 text-xs text-rose-700 dark:text-rose-400">
            Access to this workspace has been suspended. No data has been deleted.
          </p>
          <Link
            href="/organization"
            className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-xs font-semibold text-rose-800 shadow-sm transition-all hover:bg-rose-50 dark:border-rose-800 dark:bg-rose-900/60 dark:text-rose-200 dark:hover:bg-rose-900"
          >
            <ArrowLeft size={14} />
            <span>Back to Workspaces</span>
          </Link>
        </div>
      </main>
    );
  }

  // Active membership options normalization
  const activeMemberships = ws.memberships
    .filter((m) => m.member_status === 'active')
    .map((m) => ({
      organization_id: m.organization_id,
      slug: m.slug,
      name: m.name,
      kind: m.kind,
      role: m.role,
      member_status: m.member_status,
      org_status: m.org_status,
    }));

  const orgPayload = {
    id: match.id,
    name: match.name,
    slug: match.slug,
    kind: match.kind,
    plan: match.plan,
    status: match.org_status,
  };

  /* 4. Student View */
  if (match.role === 'student') {
    return (
      <StudentShell
        org={orgPayload}
        role="student"
        memberships={activeMemberships}
      >
        {children}
      </StudentShell>
    );
  }

  /* 5. Owner / Admin / Mentor Workspace View */
  return (
    <OrgShell
      org={orgPayload}
      role={match.role as 'owner' | 'admin' | 'mentor'}
      memberships={activeMemberships}
    >
      {children}
    </OrgShell>
  );
}