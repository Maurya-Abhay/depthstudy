import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { createSession, sendSocraticMessage } from '@/services/ai';

export const dynamic = 'force-dynamic';

interface CoachBody {
  skillId?: unknown;
  skillName?: unknown;
  topicId?: unknown;
  problemId?: unknown;
  problemTitle?: unknown;
  mistakeCategory?: unknown;
  message?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `ai-coach:${user.id}`, limit: 10, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: CoachBody;
  try {
    body = await readJson<CoachBody>(request, 8_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  if (!message) return NextResponse.json({ error: 'A message is required.' }, { status: 400 });

  const skillId = typeof body.skillId === 'string' ? body.skillId : undefined;
  const skillName = typeof body.skillName === 'string' ? body.skillName : undefined;
  const topicId = typeof body.topicId === 'string' ? body.topicId : undefined;
  const problemId = typeof body.problemId === 'string' ? body.problemId : undefined;
  const problemTitle = typeof body.problemTitle === 'string' ? body.problemTitle : undefined;
  const mistakeCategory = typeof body.mistakeCategory === 'string' ? body.mistakeCategory : undefined;

  // Validate skillId if provided
  if (skillId) {
    const { data: skill } = await supabase.from('skills').select('id').eq('id', skillId).eq('published', true).maybeSingle();
    if (!skill) return NextResponse.json({ error: 'Skill not found.' }, { status: 404 });
  }

  const session = await createSession(user.id, 'socratic_coach', { skillId, topicId, problemId });
  if (!session) return NextResponse.json({ error: 'Unable to create AI session.' }, { status: 500 });

  const result = await sendSocraticMessage(session.id, user.id, message, { skillName, mistakeCategory, problemTitle });

  if (!result.ok) return NextResponse.json({ error: result.error || 'AI service unavailable.' }, { status: 502 });

  return NextResponse.json({
    sessionId: session.id,
    reply: result.reply,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
