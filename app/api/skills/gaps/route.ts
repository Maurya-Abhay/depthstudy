import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getUserSkillGaps } from '@/services/skill-gap';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const gaps = await getUserSkillGaps(user.id);
    return NextResponse.json(gaps, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load skill gaps.' },
      { status: 500 },
    );
  }
}
