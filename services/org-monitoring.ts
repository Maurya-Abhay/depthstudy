import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { countOrganizationMembers } from '@/services/billing';
import { getOrganizationFeatureEntitlements } from '@/services/entitlements';

export async function getOrganizationMonitoring(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const [departments, batches, assignmentsRes, placement] = await Promise.all([
    admin.from('organization_departments').select('id').eq('organization_id', organizationId).eq('archived', false),
    admin.from('organization_batches').select('id').eq('organization_id', organizationId).eq('archived', false),
    admin.from('organization_assignments').select('id,status').eq('organization_id', organizationId),
    admin.from('organization_placement_snapshots').select('*').eq('organization_id', organizationId).order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const assignmentIds = (assignmentsRes.data ?? []).map((a) => a.id);
  const attempts = assignmentIds.length
    ? await admin.from('assignment_attempts').select('score,status,submitted_at').in('assignment_id', assignmentIds)
    : { data: [], error: null };

  const counts = await countOrganizationMembers(organizationId);
  const entitlements = await getOrganizationFeatureEntitlements(organizationId);

  const attemptRows = attempts.data ?? [];
  const scored = attemptRows.filter((r) => Number.isFinite(Number(r.score)));
  const submitted = attemptRows.filter((r) => r.status === 'submitted' || r.status === 'reviewed');
  const assignmentRows = assignmentsRes.data ?? [];
  const avgAssignmentScore = scored.length
    ? Math.round(scored.reduce((a, r) => a + Number(r.score), 0) / scored.length)
    : 0;

  return {
    students: counts.students,
    faculty: counts.faculty,
    members: counts.total,
    departments: departments.data?.length ?? 0,
    batches: batches.data?.length ?? 0,
    assignments: assignmentRows.length,
    assignmentAvgScore: avgAssignmentScore,
    assignmentCompletion: submitted.length,
    placement: placement.data ?? null,
    entitlements,
  };
}

/**
 * Mentor-scoped monitoring. A mentor sees ONLY:
 *   - batches they are explicitly assigned to (faculty_assignments or batch.mentor_id), OR
 *   - departments they are assigned to (across those departments' batches).
 * A mentor with NO assignments sees NO student/batch data at all (no org-wide fallback).
 */
export async function getMentorScope(mentorUserId: string, organizationId: string) {
  const admin = createAdminSupabaseClient();
  const [assigned, batchRows, deptRows] = await Promise.all([
    admin.from('faculty_assignments').select('batch_id,department_id').eq('organization_id', organizationId).eq('faculty_user_id', mentorUserId),
    admin.from('organization_batches').select('id,name,department_id,mentor_id').eq('organization_id', organizationId),
    admin.from('organization_departments').select('id,name').eq('organization_id', organizationId),
  ]);

  const allBatches = (batchRows.data ?? []).map((b: any) => ({ id: b.id, name: b.name, department_id: b.department_id, mentor_id: b.mentor_id }));
  const allBatchIds = new Set(allBatches.map((b) => b.id));
  const assignedDepartments = new Set((assigned.data ?? []).map((a) => a.department_id).filter((id): id is string => Boolean(id)));

  // Batch ids from (a) explicit faculty_assignments and (b) direct batch.mentor_id.
  const explicitBatchIds = (assigned.data ?? []).map((a) => a.batch_id).filter((id): id is string => Boolean(id && allBatchIds.has(id)));
  const mentorBatchIds = allBatches.filter((b) => b.mentor_id === mentorUserId).map((b) => b.id);
  const deptBatchIds = assignedDepartments.size ? allBatches.filter((b) => b.department_id && assignedDepartments.has(b.department_id)).map((b) => b.id) : [];
  const assignedBatchIds = Array.from(new Set([...explicitBatchIds, ...mentorBatchIds, ...deptBatchIds]));

  let students: { user_id: string; name: string; email: string }[] = [];
  let batches: { id: string; name: string }[] = [];
  if (assignedBatchIds.length) {
    const membership = (await admin
      .from('batch_members')
      .select('user_id,batch_id')
      .in('batch_id', assignedBatchIds)).data ?? [];
    const seen = new Map<string, { user_id: string; name: string; email: string }>();
    const userIds = Array.from(new Set((membership as Array<{ user_id: string }>).map((row) => row.user_id)));
    const { getUserDirectoryByIds } = await import('@/services/user-directory');
    const users = await getUserDirectoryByIds(userIds);
    for (const row of membership as Array<{ user_id: string }>) {
      if (!seen.has(row.user_id)) {
        const user = users.get(row.user_id);
        seen.set(row.user_id, { user_id: row.user_id, name: user?.name ?? '', email: user?.email ?? '' });
      }
    }
    students = [...seen.values()];
    batches = allBatches.filter((b) => assignedBatchIds.includes(b.id)).map((b) => ({ id: b.id, name: b.name }));
  }
  return { batches, students, assignedBatchIds, assignedDepartmentIds: [...assignedDepartments], isBroad: false };
}
