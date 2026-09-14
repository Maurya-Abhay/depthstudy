import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { recalculateSkillMastery } from '@/services/skills';

export const dynamic = 'force-dynamic';

interface RecalculateBody {
  skillId?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `skill-recalc:${user.id}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: RecalculateBody = {};
  try {
    body = await readJson<RecalculateBody>(request, 4_000);
  } catch {
    // empty body is fine — recalculate all
  }

  const skillId = typeof body.skillId === 'string' ? body.skillId : undefined;

  // Validate skillId if provided
  if (skillId) {
    const { data: skill } = await supabase.from('skills').select('id').eq('id', skillId).eq('published', true).maybeSingle();
    if (!skill) return NextResponse.json({ error: 'Published skill not found.' }, { status: 404 });
  }

  const result = await recalculateSkillMastery(user.id, skillId);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
