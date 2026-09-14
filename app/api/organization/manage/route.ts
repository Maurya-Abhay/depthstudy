import { jsonError, jsonOk } from '@/services/http';
import { requireUser } from '@/services/auth';
import { addOrganizationMember, addBatchMember, createOrganizationAssignment, createOrganizationBatch, createOrganizationDepartment, createOrganizationInvite } from '@/services/organization';

export async function POST(request: Request) {
  const user = await requireUser();
  try {
    const body = await request.json();
    const orgId = String(body.organizationId ?? '');
    if (!orgId) return jsonError('organizationId is required');
    if (body.action === 'add_member') {
      const role = body.role === 'admin' || body.role === 'mentor' || body.role === 'student' ? body.role : 'student';
      return jsonOk({ member: await addOrganizationMember(user.id, orgId, String(body.memberUserId), role) }, { status: 201 });
    }
    if (body.action === 'create_invite') {
      const role = body.role === 'admin' || body.role === 'mentor' ? body.role : 'student';
      const invite = await createOrganizationInvite(user.id, orgId, role, body.email ? String(body.email) : null);
      return jsonOk({ invite, invitePath: `/organization/invite/${invite.token}` }, { status: 201 });
    }
    if (body.action === 'add_batch_member') {
      return jsonOk({ membership: await addBatchMember(user.id, orgId, String(body.batchId), String(body.memberUserId)) }, { status: 201 });
    }
    if (body.action === 'create_department') {
      const name = String(body.name ?? '').trim();
      if (name.length < 2) return jsonError('Department name is required');
      return jsonOk({ department: await createOrganizationDepartment(user.id, orgId, name) }, { status: 201 });
    }
    if (body.action === 'create_batch') {
      if (!String(body.name ?? '').trim()) return jsonError('Batch name is required');
      return jsonOk({ batch: await createOrganizationBatch(user.id, orgId, { name: String(body.name), departmentId: body.departmentId ? String(body.departmentId) : null, startYear: body.startYear == null ? null : Number(body.startYear), endYear: body.endYear == null ? null : Number(body.endYear) }) }, { status: 201 });
    }
    if (body.action === 'create_assignment') {
      if (!String(body.title ?? '').trim()) return jsonError('Assignment title is required');
      const allowed = ['course','topic','test','dsa','project','skill'] as const;
      const targetType = allowed.includes(String(body.targetType) as any) ? String(body.targetType) as typeof allowed[number] : 'skill';
      return jsonOk({ assignment: await createOrganizationAssignment(user.id, orgId, { title:String(body.title), description:String(body.description??''), targetType, targetId:body.targetId?String(body.targetId):null, batchId:body.batchId?String(body.batchId):null, dueAt:body.dueAt?String(body.dueAt):null }) }, { status: 201 });
    }
    return jsonError('Unknown organization action');
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Organization action failed', 400); }
}
