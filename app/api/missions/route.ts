import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { generateDailyMission, getMissionForDate, getMissionsForDateRange } from '@/services/missions';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const url = new URL(request.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  try {
    if (from && to) {
      const missions = await getMissionsForDateRange(user.id, from, to);
      return NextResponse.json({ missions }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const mission = await getMissionForDate(user.id, date);
    return NextResponse.json({ mission }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to fetch missions.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `mission-generate:${user.id}`, limit: 5, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: { date?: unknown } = {};
  try {
    body = await readJson<{ date?: unknown }>(request, 4_000);
  } catch { /* ignore */ }

  const date = typeof body.date === 'string' ? body.date : undefined;

  try {
    const mission = await generateDailyMission(user.id, date);
    if (!mission) return NextResponse.json({ error: 'Unable to generate mission.' }, { status: 500 });
    return NextResponse.json({ mission }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to generate mission.' }, { status: 500 });
  }
}
