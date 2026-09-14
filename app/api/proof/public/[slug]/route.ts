import { NextResponse } from 'next/server';
import { getPublicProofProfile } from '@/services/proof';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || typeof slug !== 'string' || slug.length > 64) {
    return NextResponse.json({ error: 'Invalid share link.' }, { status: 400 });
  }

  const profile = await getPublicProofProfile(slug);

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found or not public.' }, { status: 404 });
  }

  return NextResponse.json(profile, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
