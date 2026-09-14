import { NextResponse } from 'next/server';
import { getApiAdmin, rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { generateAdminContent } from '@/services/ai';

const ALLOWED_KINDS = new Set(['topic','dsa','quiz','test','topic-outline','roadmap']);

export async function POST(request: Request) {
  const { supabase, user, response } = await getApiAdmin();
  if (response) return response;
  const limit = rateLimit(request, { key: `ai-admin:${user!.id}`, limit: 5, windowMs: 60_000 });
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfter);
  let body: { title?: unknown; kind?: unknown; instruction?: unknown };
  try { body = await readJson(request, 12_000); } catch { return NextResponse.json({ error: 'Invalid or oversized request.' }, { status: 400 }); }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const kind = typeof body.kind === 'string' ? body.kind.trim() : '';
  const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : '';
  if (!title || !ALLOWED_KINDS.has(kind) || !instruction || title.length > 200 || instruction.length > 4_000) return NextResponse.json({ error: 'Valid title, type and instruction are required.' }, { status: 400 });
  if (!process.env.OPENROUTER_API_KEY) return NextResponse.json({ error: 'AI generation is temporarily unavailable.' }, { status: 503 });
  try {
    const parsed = await generateAdminContent(kind, title, instruction);
    if (parsed === null) return NextResponse.json({ error: 'AI returned an invalid response or the provider is unavailable.' }, { status: 502 });
    const { error: logError } = await supabase.from('ai_generations').insert({ admin_user_id: user!.id, kind, title, instruction, output: parsed, status: 'draft' });
    if (logError) console.error('AI generation audit write failed', logError.code);
    return NextResponse.json({ content: parsed }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'AI generation is temporarily unavailable.' }, { status: 502 });
  }
}
