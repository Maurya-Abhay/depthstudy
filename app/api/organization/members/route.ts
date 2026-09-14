import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { OrganizationRole } from '@/services/organization';
import {
  listMembers,
  revokeInvite,
  resendInvite,
  listInvites,
  deactivateMember,
  reactivateMember,
  changeMemberRole,
} from '@/services/org-members';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can view members', 403);
    const result = await listMembers(orgId, {
      search: url.searchParams.get('search') ?? undefined,
      role: url.searchParams.get('role') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 20),
    });
    return jsonOk({ ...result, invites: await listInvites(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load members', 403);
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
      const role = (['admin', 'mentor', 'student'].includes(body.role) ? body.role : 'student') as Exclude<OrganizationRole, 'owner'>;
      const { directAddMember } = await import('@/services/org-members');
      const res = await directAddMember(user.id, orgId, { email: String(body.email ?? ''), password: String(body.password ?? ''), role });
      return jsonOk({ added: res.added, member: res.member, credentials: res.credentials }, { status: 201 });
    }
    if (action === 'revoke') return jsonOk({ ok: true, invite: await revokeInvite(user.id, orgId, String(body.inviteId)) });
    if (action === 'resend') {
      const invite = await resendInvite(user.id, orgId, String(body.inviteId));
      return jsonOk({ invite, invitePath: `/organization/invite/${invite.token}` }, { status: 201 });
    }
    if (action === 'deactivate') return jsonOk({ ok: true, member: await deactivateMember(user.id, orgId, String(body.memberUserId)) });
    if (action === 'reactivate') return jsonOk({ ok: true, member: await reactivateMember(user.id, orgId, String(body.memberUserId)) });
    if (action === 'change_role') {
      if (!['admin', 'mentor', 'student'].includes(body.role)) return jsonError('Valid role is required');
      return jsonOk({ ok: true, member: await changeMemberRole(user.id, orgId, String(body.memberUserId), body.role as OrganizationRole) });
    }
    return jsonError('Unknown member action');
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Member action failed', 403);
  }
}