import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { createSession, explainMistake } from '@/services/ai';

export const dynamic = 'force-dynamic';

interface MistakeBody {
  category?: unknown;
  description?: unknown;
  problemTitle?: unknown;
  userAnswer?: unknown;
  expectedApproach?: unknown;
  skillId?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `ai-mistake:${user.id}`, limit: 10, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: MistakeBody;
  try {
    body = await readJson<MistakeBody>(request, 10_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 50) : 'unknown';
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : undefined;
  const problemTitle = typeof body.problemTitle === 'string' ? body.problemTitle.trim().slice(0, 200) : undefined;
  const userAnswer = typeof body.userAnswer === 'string' ? body.userAnswer.trim().slice(0, 3000) : undefined;
  const expectedApproach = typeof body.expectedApproach === 'string' ? body.expectedApproach.trim().slice(0, 1000) : undefined;
  const skillId = typeof body.skillId === 'string' ? body.skillId : undefined;

  // Validate skillId if provided
  if (skillId) {
    const { data: skill } = await supabase.from('skills').select('id').eq('id', skillId).eq('published', true).maybeSingle();
    if (!skill) return NextResponse.json({ error: 'Skill not found.' }, { status: 404 });
  }

  const session = await createSession(user.id, 'mistake_explanation', { skillId });
  if (!session) return NextResponse.json({ error: 'Unable to create AI session.' }, { status: 500 });

  const result = await explainMistake(session.id, user.id, {
    category, description, problemTitle, userAnswer, expectedApproach,
  });

  if (!result.ok) return NextResponse.json({ error: result.error || 'AI service unavailable.' }, { status: 502 });

  return NextResponse.json({
    sessionId: session.id,
    reply: result.reply,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
