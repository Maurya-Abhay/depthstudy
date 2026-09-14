import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { listAuditLogs } from '@/services/org-audit';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can view the audit log', 403);
    const result = await listAuditLogs(orgId, {
      search: url.searchParams.get('search') ?? undefined,
      page: Number(url.searchParams.get('page') ?? 1),
      pageSize: Number(url.searchParams.get('pageSize') ?? 25),
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load audit log', 403);
  }
}