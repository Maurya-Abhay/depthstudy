import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { saveOnboarding, getOnboardingStatus } from '@/services/onboarding';

export const dynamic = 'force-dynamic';

interface OnboardingBody {
  interests?: unknown;
  currentLevel?: unknown;
  goals?: unknown;
  dailyMinutes?: unknown;
  learningStyle?: unknown;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const status = await getOnboardingStatus(user.id);
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `onboarding:${user.id}`, limit: 10, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: OnboardingBody;
  try {
    body = await readJson<OnboardingBody>(request, 8_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

      const result = await saveOnboarding(user.id, {
    interests: body.interests,
    currentLevel: body.currentLevel,
    goals: body.goals,
    dailyMinutes: body.dailyMinutes,
    learningStyle: body.learningStyle,
  } as Partial<import('@/types/onboarding').OnboardingInput>);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: result.data }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
