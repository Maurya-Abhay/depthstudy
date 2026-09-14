import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { updateMissionItemStatus } from '@/services/missions';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import type { MissionItemStatus } from '@/types/assessments';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: MissionItemStatus[] = ['pending', 'active', 'completed', 'skipped'];

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `mission-item:${user.id}`, limit: 30, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: { itemId?: unknown; status?: unknown };
  try {
    body = await readJson<{ itemId?: unknown; status?: unknown }>(request, 4_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const itemId = typeof body.itemId === 'string' ? body.itemId : '';
  const status = typeof body.status === 'string' && VALID_STATUSES.includes(body.status as MissionItemStatus)
    ? (body.status as MissionItemStatus)
    : null;

  if (!itemId) return NextResponse.json({ error: 'itemId is required.' }, { status: 400 });
  if (!status) return NextResponse.json({ error: 'A valid status is required.' }, { status: 400 });

  const result = await updateMissionItemStatus(itemId, user.id, status);
  if (!result.ok) return NextResponse.json({ error: result.error || 'Update failed.' }, { status: 400 });

  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
}
