import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse } from '@/services/security';
import { createSession, generateRecommendations, type SkillGapRecommendation } from '@/services/ai';
import { getUserSkillGaps } from '@/services/skill-gap';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `ai-recs:${user.id}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  // Gather skill gaps from the deterministic engine
  const gapsResult = await getUserSkillGaps(user.id).catch(() => null);
  if (!gapsResult) return NextResponse.json({ error: 'Unable to analyze skill gaps.' }, { status: 500 });

  const gaps: SkillGapRecommendation[] = gapsResult.gaps
    .filter((g) => g.gapScore > 10)
    .slice(0, 5)
    .map((g) => ({
      skillId: g.skill.id,
      skillName: g.skill.name,
      gapScore: g.gapScore,
      priority: g.priority,
      reason: g.reason,
    }));

  const session = await createSession(user.id, 'recommendation');
  if (!session) return NextResponse.json({ error: 'Unable to create AI session.' }, { status: 500 });

  const result = await generateRecommendations(session.id, user.id, gaps);
  if (!result.ok) return NextResponse.json({ error: result.error || 'AI service unavailable.' }, { status: 502 });

  return NextResponse.json({
    sessionId: session.id,
    reply: result.reply,
    gapsAnalyzed: gaps.length,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
