import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { OrganizationRole } from '@/services/organization';
import { addBatchMember } from '@/services/organization';

export type StudentInput = {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  rollNumber?: string;
  departmentId?: string | null;
  batchId?: string | null;
  externalId?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getActorRole(actorUserId: string, organizationId: string): Promise<OrganizationRole | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organization_members').select('role,status,organizations(status)').eq('organization_id', organizationId).eq('user_id', actorUserId).maybeSingle();
  if (!data || data.status === 'inactive' || (data as any).organizations?.status !== 'active') return null;
  return (data.role as OrganizationRole) ?? null;
}

async function assertCanAddStudents(actorUserId: string, organizationId: string) {
  const role = await getActorRole(actorUserId, organizationId);
  if (!role || (role !== 'owner' && role !== 'admin')) throw new Error('Only organization owners/admins can manage students');
}

async function findUserByEmail(email: string): Promise<string | null> {
  const { findAuthUserByEmail } = await import('@/services/user-directory');
  return findAuthUserByEmail(email);
}

/**
 * Add ONE student with instant login. If a password is given (or default is
 * used), an auth account is created/confirmed immediately so the student can
 * login right away with email + password and change it later from profile.
 * Falls back to a secure invite when account creation is not possible.
 */
export async function addStudent(actorUserId: string, organizationId: string, input: StudentInput) {
  await assertCanAddStudents(actorUserId, organizationId);
  const email = String(input.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error('A valid email is required');
  if (!String(input.name ?? '').trim()) throw new Error('Name is required');
  const password = String(input.password ?? '').trim();
  if (password.length < 8) throw new Error('Password is required (min 8 characters) — bina password ke student add nahi hoga');

  const admin = createAdminSupabaseClient();
  let existingUserId = await findUserByEmail(email);
  // Direct add: always create/confirm auth account so login works instantly.
  // No invite fallback — password mandatory hai.
  let createdCredentials: { email: string; password: string } | null = null;
  if (!existingUserId) {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: String(input.name).trim() } });
    if (created.data.user?.id) {
      existingUserId = created.data.user.id;
      createdCredentials = { email, password };
    } else if (created.error && String(created.error.message ?? '').toLowerCase().includes('already')) {
      existingUserId = await findUserByEmail(email);
    } else if (created.error) {
      throw new Error(created.error.message);
    }
  }
  if (!existingUserId) throw new Error('Student account banane me fail hua. Dobara try karo.');
  // Hamesha diya hua password set karo (naya ho ya purana account ho).
  const upd = await admin.auth.admin.updateUserById(existingUserId, { password });
  if (upd.error) throw new Error(upd.error.message);
  createdCredentials = { email, password };
  if (existingUserId) {
    const { data: member, error } = await admin.from('organization_members').upsert(
      { organization_id: organizationId, user_id: existingUserId, role: 'student', status: 'active', metadata: { phone: input.phone ?? null, rollNumber: input.rollNumber ?? null, externalId: input.externalId ?? null, departmentId: input.departmentId ?? null, batchId: input.batchId ?? null } },
      { onConflict: 'organization_id,user_id' },
    ).select('*').single();
    if (error) throw new Error(error.message);
    if (input.batchId) {
      try {
        await addBatchMember(actorUserId, organizationId, input.batchId, existingUserId);
      } catch (e) {
        // batch link is best-effort; surface the error text for the caller
        throw new Error(`Student added but batch assignment failed: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
    return { added: true, member, invite: null, credentials: createdCredentials };
  }

  // Yahan tak aate-aate auth account + password 100% set ho chuka hai —
  // isliye invite ka option khatm. Seedha member banao.
  const { data: member2, error: error2 } = await admin.from('organization_members').upsert(
    { organization_id: organizationId, user_id: existingUserId, role: 'student', status: 'active', metadata: { phone: input.phone ?? null, rollNumber: input.rollNumber ?? null, externalId: input.externalId ?? null, departmentId: input.departmentId ?? null, batchId: input.batchId ?? null } },
    { onConflict: 'organization_id,user_id' },
  ).select('*').single();
  if (error2) throw new Error(error2.message);
  if (input.batchId) {
    try { await addBatchMember(actorUserId, organizationId, input.batchId, existingUserId); }
    catch (e) { throw new Error(`Student added but batch assignment failed: ${e instanceof Error ? e.message : 'unknown'}`); }
  }
  return { added: true, member: member2, invite: null, credentials: createdCredentials };
}

/** Minimal CSV parser: handles quoted fields and CRLF/LF. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim().length);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? '').trim()));
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export type ImportRowResult = {
  index: number;
  name: string;
  email: string;
  department: string;
  batch: string;
  valid: boolean;
  errors: string[];
};

export async function previewBulkImport(organizationId: string, rows: Record<string, string>[]): Promise<{ rows: ImportRowResult[]; valid: number; invalid: number; duplicates: number }> {
  const admin = createAdminSupabaseClient();
  const [departments, batches, membership, invites] = await Promise.all([
    admin.from('organization_departments').select('id,name').eq('organization_id', organizationId),
    admin.from('organization_batches').select('id,name').eq('organization_id', organizationId),
    admin.from('organization_members').select('user_id').eq('organization_id', organizationId),
    admin.from('organization_invites').select('email').eq('organization_id', organizationId),
  ]);
  const deptByName = new Map((departments.data ?? []).map((d) => [String(d.name).toLowerCase(), d.id]));
  const batchByName = new Map((batches.data ?? []).map((b) => [String(b.name).toLowerCase(), b.id]));
  const knownEmails = new Set<string>();
  const { getUserDirectoryByIds } = await import('@/services/user-directory');
  const memberUsers = await getUserDirectoryByIds((membership.data ?? []).map((m) => m.user_id));
  for (const user of memberUsers.values()) {
    if (user.email) knownEmails.add(user.email.toLowerCase());
  }
  (invites.data ?? []).forEach((i) => i.email && knownEmails.add(String(i.email).toLowerCase()));
  const seenImportEmails = new Set<string>();

  const results = rows.map((raw, index) => {
    const name = String(raw.name ?? '').trim();
    const email = String(raw.email ?? '').trim().toLowerCase();
    const department = String(raw.department ?? '').trim();
    const batch = String(raw.batch ?? '').trim();
    const errors: string[] = [];
    if (!name) errors.push('Missing name');
    if (!EMAIL_RE.test(email)) errors.push('Invalid email');
    if (department && !deptByName.has(department.toLowerCase())) errors.push(`Unknown department "${department}"`);
    if (batch && !batchByName.has(batch.toLowerCase())) errors.push(`Unknown batch "${batch}"`);
    if (email && knownEmails.has(email)) errors.push('Already registered or invited');
    if (email && seenImportEmails.has(email)) errors.push('Duplicate email in import file');
    if (email) seenImportEmails.add(email);
    return { index: index + 1, name, email, department, batch, valid: errors.length === 0, errors };
  });

  const valid = results.filter((r) => r.valid).length;
  const duplicates = results.filter((r) => r.errors.some((e) => e.includes('already'))).length;
  return { rows: results, valid, invalid: results.length - valid, duplicates };
}

export async function runBulkImport(actorUserId: string, organizationId: string, rows: Record<string, string>[], defaultPassword?: string) {
  await assertCanAddStudents(actorUserId, organizationId);
  const admin = createAdminSupabaseClient();
  const preview = await previewBulkImport(organizationId, rows);

  const { data: job, error: jobError } = await admin.from('organization_import_jobs').insert({
    organization_id: organizationId,
    imported_by: actorUserId,
    kind: 'students',
    status: 'imported',
    total_rows: rows.length,
    valid_rows: preview.valid,
    error_rows: preview.invalid,
    duplicate_rows: preview.duplicates,
    completed_at: new Date().toISOString(),
  }).select('*').single();
  if (jobError) throw new Error(jobError.message);

  const rowInserts = preview.rows.map((r) => ({
    job_id: job.id,
    raw: { name: r.name, email: r.email, department: r.department, batch: r.batch },
    parsed: { name: r.name, email: r.email, department: r.department, batch: r.batch },
    status: r.valid ? 'valid' : 'invalid',
    errors: r.errors,
  }));
  if (rowInserts.length) {
    const { error } = await admin.from('organization_import_rows').insert(rowInserts);
    if (error) throw new Error(error.message);
  }

  let added = 0;
  let invited = 0;
  let skipped = 0;
  const deptByName = new Map(((await admin.from('organization_departments').select('id,name').eq('organization_id', organizationId)).data ?? []).map((d: any) => [String(d.name).toLowerCase(), d.id]));
  const batchByName = new Map(((await admin.from('organization_batches').select('id,name,department_id').eq('organization_id', organizationId)).data ?? []).map((b: any) => [String(b.name).toLowerCase(), { id: b.id, departmentId: b.department_id }]));

  for (const r of preview.rows) {
    if (!r.valid) { skipped++; await markRowStatus(admin, job.id, r.index, 'invalid'); continue; }
    try {
      const batchMeta = r.batch ? batchByName.get(r.batch.toLowerCase()) : null;
      const departmentId = r.department ? deptByName.get(r.department.toLowerCase()) ?? null : batchMeta?.departmentId ?? null;
      const result = await addStudent(actorUserId, organizationId, {
        name: r.name,
        email: r.email,
        password: defaultPassword,
        departmentId,
        batchId: batchMeta?.id ?? null,
      });
      if (result.added) { added++; await markRowStatus(admin, job.id, r.index, 'added'); }
      else { invited++; await markRowStatus(admin, job.id, r.index, 'invited'); }
    } catch {
      skipped++;
      await markRowStatus(admin, job.id, r.index, 'skipped');
    }
  }

  const result = { added, invited, skipped, duplicates: preview.duplicates, invalid: preview.invalid, total: rows.length };
  const { error: updateError } = await admin.from('organization_import_jobs').update({ added_count: added, invited_count: invited, skipped_count: skipped, result }).eq('id', job.id);
  if (updateError) throw new Error(updateError.message);
  return { ...job, result };
}

async function markRowStatus(admin: ReturnType<typeof createAdminSupabaseClient>, jobId: string, index: number, status: string) {
  const { data } = await admin.from('organization_import_rows').select('id').eq('job_id', jobId).order('id', { ascending: true });
  const rowId = data?.[index - 1]?.id;
  if (rowId == null) return;
  await admin.from('organization_import_rows').update({ status }).eq('job_id', jobId).eq('id', rowId);
}

export async function listImportJobs(organizationId: string, limit = 20) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('organization_import_jobs').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listDepartmentsLite(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organization_departments').select('id,name').eq('organization_id', organizationId).order('name');
  return data ?? [];
}

export async function listBatchesLite(organizationId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from('organization_batches').select('id,name').eq('organization_id', organizationId).order('name');
  return data ?? [];
}