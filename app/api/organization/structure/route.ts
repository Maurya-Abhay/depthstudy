import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { listDepartments, listBatches, createDepartment, updateDepartment, createBatch, updateBatch, setBatchMembers, listBatchMembers } from '@/services/org-structure';
import { getMentorScope } from '@/services/org-monitoring';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    const includeArchived = url.searchParams.get('all') === '1';
    let departments = await listDepartments(orgId, includeArchived);
    let batches = await listBatches(orgId, includeArchived);
    // Strict mentor scope: only assigned batches and their departments.
    if (role === 'mentor') {
      const scope = await getMentorScope(user.id, orgId);
      const batchSet = new Set(scope.assignedBatchIds);
      batches = (batches as any[]).filter((b) => batchSet.has(b.id));
      const deptSet = new Set(scope.assignedDepartmentIds);
      departments = (departments as any[]).filter((d) => deptSet.has(d.id));
    }
    return jsonOk({ departments, batches });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load structure', 403);
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

    if (action === 'create_department') {
      return jsonOk({ department: await createDepartment(user.id, orgId, { name: String(body.name ?? ''), description: body.description ? String(body.description) : '' }) }, { status: 201 });
    }
    if (action === 'update_department') {
      return jsonOk({ department: await updateDepartment(user.id, orgId, String(body.departmentId), { name: body.name ? String(body.name) : undefined, description: body.description !== undefined ? String(body.description) : undefined, archived: body.archived }) });
    }
    if (action === 'create_batch') {
      return jsonOk({ batch: await createBatch(user.id, orgId, { name: String(body.name ?? ''), code: body.code ? String(body.code) : undefined, departmentId: body.departmentId ? String(body.departmentId) : null, startYear: body.startYear == null ? null : Number(body.startYear), endYear: body.endYear == null ? null : Number(body.endYear), mentorId: body.mentorId ? String(body.mentorId) : null }) }, { status: 201 });
    }
    if (action === 'update_batch') {
      return jsonOk({ batch: await updateBatch(user.id, orgId, String(body.batchId), { name: body.name ? String(body.name) : undefined, code: body.code !== undefined ? String(body.code) : undefined, departmentId: body.departmentId !== undefined ? String(body.departmentId) : undefined, startYear: body.startYear != null ? Number(body.startYear) : undefined, endYear: body.endYear != null ? Number(body.endYear) : undefined, mentorId: body.mentorId !== undefined ? String(body.mentorId) : undefined, archived: body.archived }) });
    }
    if (action === 'set_batch_members') {
      const members: string[] = Array.isArray(body.memberUserIds) ? body.memberUserIds.map(String) : [];
      await setBatchMembers(user.id, orgId, String(body.batchId), members);
      return jsonOk({ ok: true, members: await listBatchMembers(String(body.batchId)) });
    }
    if (action === 'batch_members') {
      return jsonOk({ members: await listBatchMembers(String(body.batchId)) });
    }
    return jsonError('Unknown structure action');
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Structure action failed', 403);
  }
}