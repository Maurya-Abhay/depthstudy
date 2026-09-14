import { NextResponse } from 'next/server';
import { searchStudy } from '@/services/study';
import { rateLimit, rateLimitedResponse } from '@/services/security';

export async function GET(request: Request) {
  const limit = rateLimit(request, { key: 'search', limit: 30, windowMs: 60_000 });
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfter);
  const query = (new URL(request.url).searchParams.get('q') ?? '').trim().slice(0, 80);
  if (query.length < 2) return NextResponse.json({ categories: [], topics: [], courses: [], dsa: [] }, { headers: { 'Cache-Control': 'private, max-age=10' } });
  try { return NextResponse.json(await searchStudy(query), { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }); }
  catch { return NextResponse.json({ error: 'Search is temporarily unavailable.' }, { status: 500 }); }
}
