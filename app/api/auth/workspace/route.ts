import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { getWorkspaceContext } from '@/services/workspace';

/**
 * Server-side post-login routing. The login page calls this to resolve the
 * correct destination (platform admin, org manager, or learner). Authorization
 * is always re-verified by the server page/layout guards — never by the client.
 */
export async function GET() {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const workspace = await getWorkspaceContext(user.id);
    return jsonOk({
      destination: workspace.destination,
      platformAdmin: workspace.platformAdmin,
      memberships: workspace.memberships.map((m) => ({
        organization_id: m.organization_id,
        slug: m.slug,
        name: m.name,
        kind: m.kind,
        role: m.role,
        member_status: m.member_status,
        org_status: m.org_status,
      })),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to resolve workspace', 500);
  }
}