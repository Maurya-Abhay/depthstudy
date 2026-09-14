import { NextResponse } from 'next/server';
import { getStudyLibrary } from '@/services/study';

export async function GET() {
  try {
    const library = await getStudyLibrary();
    return NextResponse.json({ categories: library.categories, topics: library.topics });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load study library.' }, { status: 500 });
  }
}