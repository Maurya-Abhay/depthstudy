import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse } from '@/services/security';
import { runDiagnostic } from '@/services/onboarding';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `diagnostic:${user.id}`, limit: 3, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  const result = await runDiagnostic(user.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, assessmentId: result.assessmentId }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
