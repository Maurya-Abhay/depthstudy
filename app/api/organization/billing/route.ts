import { jsonError, jsonOk } from '@/services/http';
import { getApiUser, readJson } from '@/services/security';
import { getOrganizationBillingSnapshot } from '@/services/billing';
import { requireOrganizationManager } from '@/services/organization';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const orgId = new URL(request.url).searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can view billing', 403);
    return jsonOk({ billing: await getOrganizationBillingSnapshot(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load billing', 403);
  }
}

export async function POST(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const body = await readJson<{ organizationId?: string }>(request);
    const orgId = String(body.organizationId ?? '');
    if (!orgId) return jsonError('organizationId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can update billing', 403);
    return jsonOk({ billing: await getOrganizationBillingSnapshot(orgId) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Billing action failed', 403);
  }
}