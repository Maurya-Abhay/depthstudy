import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getSkillProfile, upsertSkillProfile } from '@/services/proof';

export const dynamic = 'force-dynamic';

// GET current user's skill profile
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const profile = await getSkillProfile(user.id);
  return NextResponse.json({ profile }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

// PATCH update skill profile
export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const headline = typeof body.headline === 'string' ? body.headline.trim().slice(0, 200) : undefined;
  const bio = typeof body.bio === 'string' ? body.bio.trim().slice(0, 1000) : undefined;
  const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : undefined;

  if (headline === undefined && bio === undefined && isPublic === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  try {
    const profile = await upsertSkillProfile(user.id, { headline, bio, isPublic });
    return NextResponse.json({ profile }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile.' },
      { status: 500 },
    );
  }
}
