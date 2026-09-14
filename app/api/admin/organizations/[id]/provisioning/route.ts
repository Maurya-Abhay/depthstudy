import { jsonError, jsonOk } from '@/services/http';
import { getApiAdmin } from '@/services/security';
import { provisionOrganizationOwner } from '@/services/organization';
import { completeProvisioningStep, getProvisioningState, setProvisioningStatus } from '@/services/organization-provisioning';
import type { ProvisioningStatus } from '@/services/organization-provisioning';
import { setOrganizationService, seedOrganizationServices } from '@/services/entitlements';
import { saveOrganizationSubscription, generateInvoice, getOrganizationBillingSnapshot } from '@/services/billing';

async function setOrgStatus(id: string, status: 'active' | 'suspended', actorId: string) {
  const { createAdminSupabaseClient } = await import('@/services/supabase-admin');
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from('organizations').update({
    status,
    suspended_at: status === 'suspended' ? new Date().toISOString() : null,
    suspended_reason: null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  await admin.from('organization_audit_logs').insert({
    organization_id: id,
    actor_user_id: actorId,
    action: status === 'suspended' ? 'organization.suspend' : 'organization.resume',
    entity_type: 'organization',
    entity_id: id,
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { response } = await getApiAdmin();
  if (response) return response;
  try {
    const { id } = await context.params;
    return jsonOk({
      provisioning: await getProvisioningState(id),
      billing: await getOrganizationBillingSnapshot(id),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load provisioning', 400);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { user, response } = await getApiAdmin();
  if (response) return response;
  try {
    const { id } = await context.params;
    const body = await request.json();
    const action = String(body.action ?? '');
    const invitePathBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (action === 'provision_owner') {
      const ownerUserId = String(body.ownerUserId ?? '');
      if (!ownerUserId) return jsonError('ownerUserId is required');
      return jsonOk({ result: await provisionOrganizationOwner(user.id, id, { ownerUserId }) });
    }

    if (action === 'resend_invite') {
      const { createAdminSupabaseClient } = await import('@/services/supabase-admin');
      const admin = createAdminSupabaseClient();
      const inviteId = String(body.inviteId ?? '');
      if (!inviteId) return jsonError('inviteId is required');
      const { data: inv } = await admin.from('organization_invites').select('id').eq('id', inviteId).eq('organization_id', id).maybeSingle();
      if (!inv) return jsonError('Invite not found');
      const { data, error } = await admin.from('organization_invites')
        .update({ status: 'pending', expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), revoked_at: null })
        .eq('id', inviteId).select('id,email,role,status,expires_at').single();
      if (error) throw new Error(error.message);
      return jsonOk({ invite: data });
    }

    if (action === 'revoke_invite') {
      const { createAdminSupabaseClient } = await import('@/services/supabase-admin');
      const admin = createAdminSupabaseClient();
      const inviteId = String(body.inviteId ?? '');
      if (!inviteId) return jsonError('inviteId is required');
      const { error } = await admin.from('organization_invites')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: user.id })
        .eq('id', inviteId).eq('organization_id', id);
      if (error) throw new Error(error.message);
      return jsonOk({ ok: true });
    }

    if (action === 'complete_step') {
      const step = Number(body.step ?? 0);
      if (step < 1) return jsonError('step is required');
      return jsonOk({ provisioning: await completeProvisioningStep(id, step) });
    }

    if (action === 'set_status') {
      const status = String(body.status ?? '') as ProvisioningStatus;
      const allowed: ProvisioningStatus[] = ['pending', 'in_progress', 'owner_invited', 'owner_accepted', 'complete', 'suspended'];
      if (!allowed.includes(status)) return jsonError('Valid provisioning status is required');
      return jsonOk({ provisioning: await setProvisioningStatus(id, status) });
    }

    if (action === 'set_service') {
      const service = String(body.service ?? '');
      const enabled = body.enabled !== false;
      const quota = body.quota == null ? null : Number(body.quota);
      await setOrganizationService(id, service, enabled, quota);
      return jsonOk({ ok: true });
    }

    if (action === 'seed_services') {
      await seedOrganizationServices(id);
      return jsonOk({ ok: true });
    }

    if (action === 'set_subscription') {
      const subscription = await saveOrganizationSubscription(id, {
        planId: body.planId ? String(body.planId) : undefined,
        cycle: body.cycle === 'yearly' ? 'yearly' : 'monthly',
        provider: String(body.provider ?? 'none'),
        providerSubscriptionId: body.providerSubscriptionId ? String(body.providerSubscriptionId) : null,
      });
      return jsonOk({ subscription });
    }

    if (action === 'generate_invoice') {
      return jsonOk({ invoice: await generateInvoice(id, { cycle: body.cycle === 'yearly' ? 'yearly' : 'monthly' }) }, { status: 201 });
    }

    if (action === 'create_owner_account') {
      const { createAdminSupabaseClient } = await import('@/services/supabase-admin');
      const admin = createAdminSupabaseClient();
      const email = String(body.email ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      const name = String(body.name ?? '').trim();
      if (!email || !email.includes('@')) return jsonError('Valid owner email is required');
      if (password.length < 8) return jsonError('Password must be at least 8 characters');
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
      let ownerUserId: string | null = created.data.user?.id ?? null;
      if (created.error) {
        const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = listed.data.users.find((u) => u.email?.toLowerCase() === email);
        if (!found) throw new Error(created.error.message);
        ownerUserId = found.id;
        const upd = await admin.auth.admin.updateUserById(found.id, { password });
        if (upd.error) throw new Error(upd.error.message);
      }
      if (!ownerUserId) return jsonError('Could not create owner account');
      const result = await provisionOrganizationOwner(user.id, id, { ownerUserId });
      return jsonOk({ result, ownerUserId }, { status: 201 });
    }

    if (action === 'set_member_password') {
      const { createAdminSupabaseClient } = await import('@/services/supabase-admin');
      const admin = createAdminSupabaseClient();
      const memberUserId = String(body.memberUserId ?? '');
      const password = String(body.password ?? '');
      if (!memberUserId) return jsonError('memberUserId is required');
      if (password.length < 8) return jsonError('Password must be at least 8 characters');
      const { data: mem } = await admin.from('organization_members').select('user_id').eq('organization_id', id).eq('user_id', memberUserId).maybeSingle();
      if (!mem) return jsonError('Member does not belong to this organization');
      const upd = await admin.auth.admin.updateUserById(memberUserId, { password });
      if (upd.error) throw new Error(upd.error.message);
      await admin.from('organization_audit_logs').insert({ organization_id: id, actor_user_id: user.id, action: 'member.password_reset', entity_type: 'organization_member', entity_id: memberUserId });
      return jsonOk({ ok: true });
    }

    if (action === 'send_reset_link') {
      const { createAdminSupabaseClient } = await import('@/services/supabase-admin');
      const admin = createAdminSupabaseClient();
      const memberUserId = String(body.memberUserId ?? '');
      if (!memberUserId) return jsonError('memberUserId is required');
      const { data: mem } = await admin.from('organization_members').select('user_id').eq('organization_id', id).eq('user_id', memberUserId).maybeSingle();
      if (!mem) return jsonError('Member does not belong to this organization');
      const u = await admin.auth.admin.getUserById(memberUserId);
      const email = u.data.user?.email;
      if (!email) return jsonError('Member has no email address');
      const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo: `${invitePathBase}/auth/reset-password` });
      if (error) throw new Error(error.message);
      await admin.from('organization_audit_logs').insert({ organization_id: id, actor_user_id: user.id, action: 'member.reset_link_sent', entity_type: 'organization_member', entity_id: memberUserId });
      return jsonOk({ ok: true, email });
    }

    if (action === 'suspend') {
      await setOrgStatus(id, 'suspended', user.id);
      await setProvisioningStatus(id, 'suspended');
      return jsonOk({ ok: true });
    }

    if (action === 'resume') {
      await setOrgStatus(id, 'active', user.id);
      const prov = await setProvisioningStatus(id, 'owner_accepted');
      return jsonOk({ ok: true, provisioning: prov });
    }

    return jsonError('Unknown provisioning action');
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Provisioning action failed', 400);
  }
}
