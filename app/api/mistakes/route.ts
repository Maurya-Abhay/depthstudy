import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getMistakeIntelligence } from '@/services/mistakes';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  try {
    const intelligence = await getMistakeIntelligence(user.id);
    return NextResponse.json(intelligence, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to fetch mistake data.' }, { status: 500 });
  }
}
