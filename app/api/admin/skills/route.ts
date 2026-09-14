import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { rateLimit, rateLimitedResponse, readJson } from '@/services/security';
import { getApiAdmin } from '@/services/security';

export const dynamic = 'force-dynamic';

// GET: list all skills (admin only)
export async function GET(request: Request) {
  const { supabase, response } = await getApiAdmin();
  if (response) return response;

  const url = new URL(request.url);
  const includeUnpublished = url.searchParams.get('all') === 'true';

  let query = supabase
    .from('skills')
    .select('id, name, slug, description, category, published, sort_order, created_at')
    .order('sort_order')
    .order('name');

  if (!includeUnpublished) query = query.eq('published', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ skills: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } });
}

// POST: create a new skill (admin only)
export async function POST(request: Request) {
  const { supabase, response } = await getApiAdmin();
  if (response) return response;

  const limiter = rateLimit(request, { key: 'skill-create', limit: 20, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  let body: { name?: unknown; slug?: unknown; description?: unknown; category?: unknown; published?: unknown; sortOrder?: unknown };
  try {
    body = await readJson(request, 8_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  const slug = typeof body.slug === 'string' ? body.slug.trim().slice(0, 80) : '';
  const description = typeof body.description === 'string' ? body.description.slice(0, 500) : '';
  const category = typeof body.category === 'string' ? body.category.trim().slice(0, 60) : 'general';
  const published = typeof body.published === 'boolean' ? body.published : true;
  const sortOrder = typeof body.sortOrder === 'number' ? Math.max(0, Math.min(9999, body.sortOrder)) : 0;

  if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 });

  const { data, error } = await supabase
    .from('skills')
    .insert({ name, slug, description, category, published, sort_order: sortOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ skill: data }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
}

// PATCH: update a skill (admin only)
export async function PATCH(request: Request) {
  const { supabase, response } = await getApiAdmin();
  if (response) return response;

  let body: { id?: unknown; name?: unknown; slug?: unknown; description?: unknown; category?: unknown; published?: unknown; sortOrder?: unknown };
  try {
    body = await readJson(request, 8_000);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'Skill id is required.' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === 'string') update.name = body.name.trim().slice(0, 120);
  if (typeof body.slug === 'string') update.slug = body.slug.trim().slice(0, 80);
  if (typeof body.description === 'string') update.description = body.description.slice(0, 500);
  if (typeof body.category === 'string') update.category = body.category.trim().slice(0, 60);
  if (typeof body.published === 'boolean') update.published = body.published;
  if (typeof body.sortOrder === 'number') update.sort_order = Math.max(0, Math.min(9999, body.sortOrder));

  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const { data, error } = await supabase
    .from('skills')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ skill: data }, { headers: { 'Cache-Control': 'private, no-store' } });
}
