import { NextResponse } from 'next/server';
import { getApiAdmin, readJson, rateLimit, rateLimitedResponse } from '@/services/security';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

const defaults = { brand: 'Depth Study', maintenance: false, notifyAdmin: true, compact: false };

export async function GET() {
  const { response, user } = await getApiAdmin();
  if (response || !user) return response ?? NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('platform_settings').select('brand,maintenance,notify_admin,compact').eq('id', 1).maybeSingle();
  const settings = data ? { brand: data.brand, maintenance: data.maintenance, notifyAdmin: data.notify_admin, compact: data.compact } : defaults;
  return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function PATCH(request: Request) {
  const { response, user } = await getApiAdmin();
  if (response || !user) return response ?? NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const limiter = rateLimit(request, { key: `admin-settings:${user.id}`, limit: 20, windowMs: 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);
  let body: Partial<typeof defaults>;
  try { body = await readJson<Partial<typeof defaults>>(request, 4_000); }
  catch { return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 }); }
  const patch = {
    id: 1,
    brand: typeof body.brand === 'string' ? body.brand.trim().slice(0, 80) || 'Depth Study' : defaults.brand,
    maintenance: body.maintenance === true,
    notify_admin: body.notifyAdmin !== false,
    compact: body.compact === true,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('platform_settings').upsert(patch, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: 'Settings could not be saved.' }, { status: 500 });
  await admin.from('activity_logs').insert({ user_id: user.id, event_type: 'ADMIN_SETTINGS_UPDATED', entity_type: 'platform_settings', metadata: { brand: patch.brand, maintenance: patch.maintenance, notify_admin: patch.notify_admin, compact: patch.compact } });
  return NextResponse.json({ settings: { brand: patch.brand, maintenance: patch.maintenance, notifyAdmin: patch.notify_admin, compact: patch.compact } });
}
