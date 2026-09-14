import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { getOrganizationMonitoring, getMentorScope } from '@/services/org-monitoring';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const url = new URL(request.url);
    const orgId = url.searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role === 'mentor') {
      return jsonOk({ mentor: await getMentorScope(user.id, orgId) });
    }
    return jsonOk({ monitoring: await getOrganizationMonitoring(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load monitoring', 403);
  }
}