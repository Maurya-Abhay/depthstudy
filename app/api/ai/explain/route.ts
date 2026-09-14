import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { createSession, explainCode } from '@/services/ai';

export const dynamic = 'force-dynamic';

interface ExplainBody {
  code?: unknown;
  language?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `ai-explain:${user.id}`, limit: 10, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: ExplainBody;
  try {
    body = await readJson<ExplainBody>(request, 12_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const code = typeof body.code === 'string' ? body.code.trim().slice(0, 6000) : '';
  if (!code) return NextResponse.json({ error: 'Code is required.' }, { status: 400 });

  const language = typeof body.language === 'string' ? body.language.trim().slice(0, 20) : undefined;

  const session = await createSession(user.id, 'code_explanation');
  if (!session) return NextResponse.json({ error: 'Unable to create AI session.' }, { status: 500 });

  const result = await explainCode(session.id, user.id, code, language);
  if (!result.ok) return NextResponse.json({ error: result.error || 'AI service unavailable.' }, { status: 502 });

  return NextResponse.json({
    sessionId: session.id,
    reply: result.reply,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
