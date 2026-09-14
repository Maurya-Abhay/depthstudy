import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';

export type OrgRole = 'owner' | 'admin' | 'mentor' | 'student';

export type WorkspaceMembership = {
  organization_id: string;
  role: OrgRole;
  member_status: string; // active | inactive
  id: string;
  name: string;
  slug: string;
  kind: string;
  org_status: string; // active | suspended
  plan: string;
};

export type AuthWorkspace = {
  userId: string;
  platformAdmin: boolean;
  memberships: WorkspaceMembership[];
  /** Role of the chosen landing workspace (null when none). */
  primaryRole: OrgRole | null;
  destination: string;
  suspendedExcluded: boolean;
};

function destinationFor(w: AuthWorkspace): string {
  if (w.platformAdmin) return '/admin';
  const manager = w.memberships.find(
    (m) => m.member_status === 'active' && m.org_status === 'active' && (m.role === 'owner' || m.role === 'admin' || m.role === 'mentor'),
  );
  if (manager) return `/organization/${manager.slug}`;
  // Active student membership → apne organization ka student portal.
  const student = w.memberships.find(
    (m) => m.member_status === 'active' && m.org_status === 'active' && m.role === 'student',
  );
  if (student) return '/user';
  // No org at all → learner workspace.
  return '/user';
}

/**
 * Server-side, single source of truth for post-login routing and tenant context.
 * Resolves platform-admin status and ALL organization memberships from the DB
 * (never from who created the organization, never from browser hints).
 */
export async function getWorkspaceContext(userId: string): Promise<AuthWorkspace> {
  const admin = createAdminSupabaseClient();

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    admin.from('profiles').select('role').eq('id', userId).maybeSingle(),
    admin
      .from('organization_members')
      .select('organization_id,role,status,organizations(id,name,slug,kind,status,plan)')
      .eq('user_id', userId),
  ]);

  const platformAdmin = profile?.role === 'admin';
  const rows: WorkspaceMembership[] = ((memberships ?? []) as any[]).map((m) => {
    const org = m.organizations ?? {};
    return {
      organization_id: m.organization_id,
      role: (m.role ?? 'student') as OrgRole,
      member_status: m.status ?? 'active',
      id: org.id ?? m.organization_id,
      name: org.name ?? '',
      slug: org.slug ?? '',
      kind: org.kind ?? 'college',
      org_status: org.status ?? 'active',
      plan: org.plan ?? '',
    };
  });

  const workspace: AuthWorkspace = {
    userId,
    platformAdmin,
    memberships: rows,
    primaryRole: rows.length ? rows[0].role : null,
    destination: '/',
    suspendedExcluded: rows.some((r) => r.org_status !== 'active'),
  };
  workspace.destination = destinationFor(workspace);
  const primaryActiveManager = rows.find(
    (m) => m.member_status === 'active' && m.org_status === 'active' && (m.role === 'owner' || m.role === 'admin' || m.role === 'mentor'),
  );
  workspace.primaryRole = primaryActiveManager?.role ?? null;
  return workspace;
}

/**
 * Resolve the authenticated user's workspace using the current SSR session.
 * Requires a logged-in user (throws/returns null when unauthenticated).
 */
export async function resolveAuthenticatedWorkspace(): Promise<AuthWorkspace | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return getWorkspaceContext(data.user.id);
}