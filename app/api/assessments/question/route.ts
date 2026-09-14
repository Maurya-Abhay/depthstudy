import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getNextQuestion } from '@/services/assessments';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const url = new URL(request.url);
  const assessmentId = url.searchParams.get('assessmentId');
  if (!assessmentId) return NextResponse.json({ error: 'assessmentId is required.' }, { status: 400 });

  try {
    const result = await getNextQuestion(user.id, assessmentId);
    if (!result) return NextResponse.json({ error: 'No question available.' }, { status: 404 });
    return NextResponse.json({ question: result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to fetch question.' }, { status: 500 });
  }
}
