import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { addStudent, previewBulkImport, runBulkImport, listImportJobs, parseCsv } from '@/services/org-students';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can manage students', 403);
    return jsonOk({ jobs: await listImportJobs(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load import jobs', 403);
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

    if (action === 'add_one') {
      const student = await addStudent(user.id, orgId, {
        name: String(body.name ?? ''),
        email: String(body.email ?? ''),
        password: body.password ? String(body.password) : undefined,
        phone: body.phone ? String(body.phone) : undefined,
        rollNumber: body.rollNumber ? String(body.rollNumber) : undefined,
        departmentId: body.departmentId ? String(body.departmentId) : null,
        batchId: body.batchId ? String(body.batchId) : null,
        externalId: body.externalId ? String(body.externalId) : undefined,
      });
      return jsonOk({ student }, { status: 201 });
    }

    if (action === 'preview') {
      const text = String(body.csv ?? '');
      if (!text.trim()) return jsonError('CSV content is required');
      const rows = parseCsv(text);
      if (!rows.length) return jsonError('No rows found in CSV');
      return jsonOk({ preview: await previewBulkImport(orgId, rows), rows });
    }

    if (action === 'import') {
      const rows: Record<string, string>[] = body.rows ?? [];
      if (!Array.isArray(rows) || !rows.length) return jsonError('rows are required');
      const defaultPassword = body.defaultPassword ? String(body.defaultPassword) : undefined;
      return jsonOk({ job: await runBulkImport(user.id, orgId, rows, defaultPassword) }, { status: 201 });
    }

    return jsonError('Unknown student action');
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Student action failed', 403);
  }
}