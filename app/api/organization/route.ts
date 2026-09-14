import { jsonError, jsonOk } from '@/services/http';
import { requireUser, getCurrentRole } from '@/services/auth';
import { createOrganization, getOrganizationDashboard, getUserOrganizations } from '@/services/organization';

export async function GET(request: Request) {
  const user = await requireUser();
  try {
    const orgId = new URL(request.url).searchParams.get('orgId');
    if (orgId) return jsonOk({ dashboard: await getOrganizationDashboard(user.id, orgId) });
    return jsonOk({ organizations: await getUserOrganizations(user.id) });
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to load organization', 403); }
}

export async function POST(request: Request) {
  const user = await requireUser();
  if ((await getCurrentRole(user.id)) !== 'admin') return jsonError('Only platform admins can create organizations', 403);
  try {
    const body = await request.json();
    const name = String(body.name ?? '').trim();
    const slug = String(body.slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
    if (name.length < 2 || slug.length < 2) return jsonError('Valid organization name and slug are required');
    const organization = await createOrganization(user.id, {
      name, slug, kind: body.kind,
      planId: body.planId ? String(body.planId) : null,
      legalName: body.legalName ? String(body.legalName) : null,
      phone: body.phone ? String(body.phone) : null,
      officialEmail: body.officialEmail ? String(body.officialEmail) : null,
      website: body.website ? String(body.website) : null,
      address: body.address ? String(body.address) : null,
      city: body.city ? String(body.city) : null,
      state: body.state ? String(body.state) : null,
      country: body.country ? String(body.country) : null,
      postalCode: body.postalCode ? String(body.postalCode) : null,
      contactPerson: body.contactPerson ? String(body.contactPerson) : null,
      notes: body.notes ? String(body.notes) : null,
      ownerEmail: body.ownerEmail ? String(body.ownerEmail) : null,
      ownerName: body.ownerName ? String(body.ownerName) : null,
      ownerPhone: body.ownerPhone ? String(body.ownerPhone) : null,
    });
    return jsonOk({ organization }, { status: 201 });
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to create organization', 400); }
}
