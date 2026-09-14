import { NextResponse } from 'next/server';
import { verifyByCode } from '@/services/proof';
import { rateLimit, rateLimitedResponse } from '@/services/security';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const limiter = rateLimit(request, { key: `verify:${code}`, limit: 30, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);

  if (!code || typeof code !== 'string' || code.length > 64) {
    return NextResponse.json({ valid: false, error: 'Invalid verification code.' }, { status: 400 });
  }

  const result = await verifyByCode(code);

  if (!result) {
    return NextResponse.json({ valid: false, error: 'Verification code not found.' }, { status: 404 });
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
