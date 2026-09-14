import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { listFaculty, assignFaculty, removeFacultyAssignment, inviteFaculty } from '@/services/org-faculty';
import { deactivateMember, reactivateMember } from '@/services/org-members';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const orgId = new URL(request.url).searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can view faculty', 403);
    return jsonOk({ faculty: await listFaculty(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load faculty', 403);
  }
}

export async function POST(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const body = await request.json();
    const orgId = String(body.organizationId ?? '');
    if (!orgId) return jsonError('organizationId is required');
    await requireOrganizationManager(user.id, orgId);
    const action = String(body.action ?? '');

    if (action === 'invite') {
      const invite = await inviteFaculty(user.id, orgId, String(body.email ?? ''), body.password ? String(body.password) : undefined);
      const invitePath = (invite as any)?.token ? `/organization/invite/${(invite as any).token}` : null;
      return jsonOk({ invite, invitePath }, { status: 201 });
    }
    if (action === 'assign') {
      await assignFaculty(user.id, orgId, String(body.facultyUserId), { departmentId: body.departmentId ? String(body.departmentId) : null, batchId: body.batchId ? String(body.batchId) : null });
      return jsonOk({ ok: true });
    }
    if (action === 'unassign') {
      await removeFacultyAssignment(user.id, orgId, String(body.facultyUserId), String(body.batchId));
      return jsonOk({ ok: true });
    }
    if (action === 'deactivate') return jsonOk({ ok: true, member: await deactivateMember(user.id, orgId, String(body.facultyUserId)) });
    if (action === 'reactivate') return jsonOk({ ok: true, member: await reactivateMember(user.id, orgId, String(body.facultyUserId)) });
    return jsonError('Unknown faculty action');
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Faculty action failed', 403);
  }
}