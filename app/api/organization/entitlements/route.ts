import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { getOrganizationFeatureEntitlements, assertOrganizationService } from '@/services/entitlements';
import { requireOrganizationManager } from '@/services/organization';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const orgId = new URL(request.url).searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    await requireOrganizationManager(user.id, orgId);
    return jsonOk({ entitlements: await getOrganizationFeatureEntitlements(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load entitlements', 403);
  }
}

export async function POST(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const body = await request.json();
    const orgId = String(body.organizationId ?? '');
    const service = String(body.service ?? '');
    if (!orgId || !service) return jsonError('organizationId and service are required');
    await requireOrganizationManager(user.id, orgId);
    await assertOrganizationService(orgId, service);
    return jsonOk({ enabled: true });
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === 'SERVICE_DISABLED') {
      return jsonError(error.message, 403);
    }
    return jsonError(error instanceof Error ? error.message : 'Service check failed', 403);
  }
}