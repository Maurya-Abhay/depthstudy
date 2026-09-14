import { jsonError, jsonOk } from '@/services/http';
import { requireUser } from '@/services/auth';
import { getUserOrganizationAssignments } from '@/services/organization';

export async function GET() {
  const user = await requireUser();
  try { return jsonOk({ assignments: await getUserOrganizationAssignments(user.id) }); }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to load assignments', 500); }
}
