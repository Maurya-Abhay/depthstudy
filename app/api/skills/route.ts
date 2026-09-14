import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getUserSkillProfile } from '@/services/skills';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const profile = await getUserSkillProfile(user.id);
    return NextResponse.json(profile, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load skill profile.' },
      { status: 500 },
    );
  }
}
