import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { submitAnswer } from '@/services/assessments';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `assessment-answer:${user.id}`, limit: 30, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: { assessmentId?: unknown; itemId?: unknown; selectedOption?: unknown };
  try {
    body = await readJson<{ assessmentId?: unknown; itemId?: unknown; selectedOption?: unknown }>(request, 4_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const assessmentId = typeof body.assessmentId === 'string' ? body.assessmentId : '';
  const itemId = typeof body.itemId === 'string' ? body.itemId : '';
  const selectedOption = typeof body.selectedOption === 'number' ? body.selectedOption : -1;

  if (!assessmentId || !itemId) {
    return NextResponse.json({ error: 'assessmentId and itemId are required.' }, { status: 400 });
  }

  try {
    const result = await submitAnswer(user.id, assessmentId, itemId, selectedOption);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to submit answer.' }, { status: 500 });
  }
}
