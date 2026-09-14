import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { recordSkillEvent, recalculateSkillMastery } from '@/services/skills';
import type { SkillEventType, SkillEventSource } from '@/types/skills';

export const dynamic = 'force-dynamic';

const VALID_EVENT_TYPES: SkillEventType[] = [
  'topic_progress', 'topic_completed', 'test_passed', 'test_attempt',
  'dsa_accepted', 'dsa_submission', 'activity', 'study_session',
];

const VALID_SOURCES: SkillEventSource[] = ['system', 'progress', 'test', 'dsa', 'activity'];

interface EventBody {
  skillId?: unknown;
  topicId?: unknown;
  eventType?: unknown;
  score?: unknown;
  source?: unknown;
  entityType?: unknown;
  entityId?: unknown;
  metadata?: unknown;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const limiter = rateLimit(request, { key: `skill-event:${user.id}`, limit: 30, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: EventBody;
  try {
    body = await readJson<EventBody>(request, 16_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const eventType = typeof body.eventType === 'string' && VALID_EVENT_TYPES.includes(body.eventType as SkillEventType)
    ? (body.eventType as SkillEventType)
    : null;
  if (!eventType) return NextResponse.json({ error: 'A valid eventType is required.' }, { status: 400 });

  const source = typeof body.source === 'string' && VALID_SOURCES.includes(body.source as SkillEventSource)
    ? (body.source as SkillEventSource)
    : 'system';

  const skillId = typeof body.skillId === 'string' ? body.skillId : null;
  const topicId = typeof body.topicId === 'string' ? body.topicId : null;
  const entityType = typeof body.entityType === 'string' ? body.entityType : null;
  const entityId = typeof body.entityId === 'string' ? body.entityId : null;
  const score = typeof body.score === 'number' ? Math.max(0, Math.min(100, body.score)) : null;
  const metadata = typeof body.metadata === 'object' && body.metadata !== null
    ? (body.metadata as Record<string, unknown>)
    : {};

  // Validate skillId exists if provided
  if (skillId) {
    const { data: skill } = await supabase.from('skills').select('id').eq('id', skillId).eq('published', true).maybeSingle();
    if (!skill) return NextResponse.json({ error: 'Published skill not found.' }, { status: 404 });
  }

  const result = await recordSkillEvent({
    userId: user.id,
    skillId,
    topicId,
    eventType,
    score,
    source,
    entityType,
    entityId,
    metadata,
  });

  if (!result.ok) return NextResponse.json({ error: result.error || 'Failed to record event.' }, { status: 400 });

  // Recalculate mastery for the affected skill
  if (skillId) {
    await recalculateSkillMastery(user.id, skillId);
  }

  return NextResponse.json({ ok: true, id: result.id }, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
