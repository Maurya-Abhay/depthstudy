import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { createAdaptiveAssessment, getAssessmentResult } from '@/services/assessments';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';

export const dynamic = 'force-dynamic';

// GET: fetch assessment result
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const url = new URL(request.url);
  const assessmentId = url.searchParams.get('id');
  if (!assessmentId) return NextResponse.json({ error: 'Assessment id is required.' }, { status: 400 });

  try {
    const result = await getAssessmentResult(assessmentId, user.id);
    if (!result) return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to fetch assessment.' }, { status: 500 });
  }
}

// POST: create a new adaptive assessment
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `assessment-create:${user.id}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: { blueprintId?: unknown; skillId?: unknown } = {};
  try {
    body = await readJson<{ blueprintId?: unknown; skillId?: unknown }>(request, 4_000);
  } catch { /* ignore */ }

  const blueprintId = typeof body.blueprintId === 'string' ? body.blueprintId : null;
  const skillId = typeof body.skillId === 'string' ? body.skillId : null;

  // Validate blueprintId if provided
  if (blueprintId) {
    const { data: blueprint } = await supabase
      .from('assessment_blueprints')
      .select('id')
      .eq('id', blueprintId)
      .eq('published', true)
      .maybeSingle();
    if (!blueprint) return NextResponse.json({ error: 'Published blueprint not found.' }, { status: 404 });
  }

  try {
    const result = await createAdaptiveAssessment(user.id, blueprintId, skillId);
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create assessment.' }, { status: 500 });
  }
}
