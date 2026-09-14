import { jsonError, jsonOk } from '@/services/http';
import { getApiAdmin } from '@/services/security';
import { createPlan, getPlans, setPlanActive, updatePlan } from '@/services/plans';

export async function GET(request: Request) {
  const { response } = await getApiAdmin();
  if (response) return response;
  try {
    const includeInactive = new URL(request.url).searchParams.get('all') === '1';
    return jsonOk({ plans: await getPlans(includeInactive) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load plans', 400);
  }
}

export async function POST(request: Request) {
  const { response } = await getApiAdmin();
  if (response) return response;
  try {
    const body = await request.json();
    if (!String(body.name ?? '').trim() || !String(body.code ?? '').trim()) {
      return jsonError('Plan name and code are required');
    }
    return jsonOk({ plan: await createPlan(body) }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create plan', 400);
  }
}

export async function PATCH(request: Request) {
  const { response } = await getApiAdmin();
  if (response) return response;
  try {
    const body = await request.json();
    const id = String(body.id ?? '');
    if (!id) return jsonError('Plan id is required');
    if (typeof body.active === 'boolean') {
      await setPlanActive(id, body.active);
    }
    if (body.name || body.code || body.monthlyPrice != null || body.yearlyPrice != null || body.billingModel) {
      await updatePlan(id, body);
    }
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update plan', 400);
  }
}