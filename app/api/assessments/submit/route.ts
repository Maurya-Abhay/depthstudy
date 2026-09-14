import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { submitAssessment } from '@/services/assessments';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `assessment-submit:${user.id}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: { assessmentId?: unknown };
  try {
    body = await readJson<{ assessmentId?: unknown }>(request, 4_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const assessmentId = typeof body.assessmentId === 'string' ? body.assessmentId : '';
  if (!assessmentId) return NextResponse.json({ error: 'assessmentId is required.' }, { status: 400 });

  try {
    const result = await submitAssessment(user.id, assessmentId);
    if (!result.ok) return NextResponse.json({ error: result.error || 'Failed.' }, { status: 400 });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to submit assessment.' }, { status: 500 });
  }
}
