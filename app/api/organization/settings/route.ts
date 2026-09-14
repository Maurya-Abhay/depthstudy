import { jsonError, jsonOk } from '@/services/http';
import { getApiUser } from '@/services/security';
import { requireOrganizationManager } from '@/services/organization';
import { getOrganizationSettings, updateOrganizationProfile } from '@/services/org-settings';

export async function GET(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const orgId = new URL(request.url).searchParams.get('orgId') ?? '';
    if (!orgId) return jsonError('orgId is required');
    await requireOrganizationManager(user.id, orgId);
    return jsonOk(await getOrganizationSettings(orgId));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load settings', 403);
  }
}

export async function POST(request: Request) {
  const { user } = await getApiUser();
  if (!user) return jsonError('Authentication required.', 401);
  try {
    const body = await request.json();
    const orgId = String(body.organizationId ?? '');
    if (!orgId) return jsonError('organizationId is required');
    const role = await requireOrganizationManager(user.id, orgId);
    if (role !== 'owner' && role !== 'admin') return jsonError('Only organization owners/admins can edit settings', 403);
    return jsonOk({ organization: await updateOrganizationProfile(user.id, orgId, body) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Settings update failed', 403);
  }
}