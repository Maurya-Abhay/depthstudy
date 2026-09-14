import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { getApiAdmin, readJson, rateLimit, rateLimitedResponse } from '@/services/security';

const tableOrder = [
  'profiles',
  'study_categories',
  'study_modules',
  'study_topics',
  'courses',
  'course_categories',
  'course_topics',
  'enrollments',
  'topic_progress',
  'study_schedules',
  'personal_notes',
  'bookmarks',
  'questions',
  'tests',
  'test_questions',
  'test_attempts',
  'test_answers',
  'dsa_topics',
  'dsa_problems',
  'dsa_submissions',
  'certificates',
  'ai_generations',
  'notifications',
  'skills',
  'skill_topics',
  'user_skill_mastery',
  'skill_events',
  'skill_gap_snapshots',
  'mistake_categories',
  'mistake_logs',
  'learning_missions',
  'learning_mission_items',
  'assessment_blueprints',
  'adaptive_assessments',
  'adaptive_assessment_items',
  'ai_sessions',
  'ai_messages',
  'ai_feedback',
  'learning_recommendations',
  'skill_profiles',
  'verified_assessments',
  'skill_evidence',
  'public_skill_profiles',
  'platform_settings',
  'user_onboarding',
  'learning_reviews',
  'mistake_trends',
  'content_quality_metrics',
  'content_reports',
  'projects',
  'project_enrollments',
  'project_submissions',
  'project_milestones',
  'project_milestone_progress',
  'interview_tracks',
  'interview_questions',
  'interview_sessions',
  'interview_answers',
  'placement_readiness_snapshots',
  'organization_plan_definitions',
  'organizations',
  'organization_billing_profiles',
  'organization_provisioning',
  'organization_feature_entitlements',
  'organization_subscriptions',
  'organization_members',
  'organization_invites',
  'organization_departments',
  'organization_batches',
  'batch_members',
  'faculty_assignments',
  'organization_assignments',
  'assignment_attempts',
  'organization_audit_logs',
  'billing_events',
  'organization_usage',
  'organization_usage_events',
  'organization_import_rows',
  'organization_skill_snapshots',
  'organization_placement_snapshots',
  'organization_invoices',
  'organization_invoice_items',
  'organization_payments',
  'organization_import_jobs',
  'organization_entitlements',
  'user_entitlements',
] as const;
const conflictKeys: Record<string,string> = {
  course_categories: 'course_id,category_id',
  course_topics: 'course_id,topic_id',
  enrollments: 'user_id,course_id',
  topic_progress: 'user_id,topic_id',
  bookmarks: 'user_id,topic_id',
  test_questions: 'test_id,question_id',
  test_answers: 'attempt_id,question_id',
  user_skill_mastery: 'user_id,skill_id',
  learning_mission_items: 'mission_id,position',
  adaptive_assessment_items: 'assessment_id,position',
  mistake_categories: 'code',
  user_onboarding: 'user_id',
  project_enrollments: 'user_id,project_id',
  project_milestone_progress: 'user_id,milestone_id',
  organization_plan_definitions: 'code',
  organizations: 'id',
  organization_members: 'organization_id,user_id',
  organization_billing_profiles: 'organization_id',
  organization_provisioning: 'organization_id',
  organization_feature_entitlements: 'organization_id,service',
  organization_subscriptions: 'organization_id,billing_cycle',
  organization_invites: 'id',
  organization_audit_logs: 'id',
  organization_departments: 'id',
  organization_batches: 'id',
  batch_members: 'batch_id,user_id',
  faculty_assignments: 'id',
  organization_assignments: 'id',
  assignment_attempts: 'assignment_id,user_id',
  organization_skill_snapshots: 'id',
  organization_placement_snapshots: 'id',
  organization_invoices: 'invoice_number',
  organization_invoice_items: 'id',
  organization_payments: 'id',
  billing_events: 'provider,provider_event_id',
  organization_usage: 'organization_id,period',
  organization_usage_events: 'id',
  organization_import_jobs: 'id',
  organization_import_rows: 'id',
  organization_entitlements: 'organization_id',
  user_entitlements: 'user_id',
};

export async function POST(request: Request) {
  const { response, user } = await getApiAdmin();
  if (response || !user) return response ?? NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  const limiter = rateLimit(request, { key: `admin-restore:${user.id}`, limit: 2, windowMs: 10 * 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);
  let body: { confirm?: unknown; backup?: unknown };
  try { body = await readJson(request, 15_000_000); } catch { return NextResponse.json({ error: 'Backup file is invalid or too large.' }, { status: 400 }); }
  if (body.confirm !== true) return NextResponse.json({ error: 'Restore requires explicit confirmation.' }, { status: 400 });
  const backup = body.backup as { version?: unknown; tables?: unknown } | undefined;
  if (!backup || ![1,2].includes(Number(backup.version)) || !backup.tables || typeof backup.tables !== 'object') return NextResponse.json({ error: 'Unsupported backup format.' }, { status: 400 });
  const backupVersion = Number(backup.version);
  const tables = backup.tables as Record<string, unknown>;
  const rowsTotal = tableOrder.reduce((n, t) => n + (Array.isArray(tables[t]) ? (tables[t] as unknown[]).length : 0), 0);
  if (rowsTotal > 100_000) return NextResponse.json({ error: 'Backup contains too many rows for a single restore.' }, { status: 413 });
  const admin = createAdminSupabaseClient();
  const restored: Record<string, number> = {};
  const errors: Record<string, string> = {};
  // Merge-only restore: never deletes rows and never touches auth.users/activity_logs/AI secrets.
  for (const table of tableOrder) {
    const rows = tables[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    for (let offset = 0; offset < rows.length; offset += 500) {
      const chunk = rows.slice(offset, offset + 500).filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row));
      if (!chunk.length) continue;
      const query = admin.from(table);
      const key = conflictKeys[table];
      const result = key ? await query.upsert(chunk, { onConflict: key }) : await query.upsert(chunk, { onConflict: 'id' });
      if (result.error) { errors[table] = 'Restore could not safely import this table.'; break; }
      restored[table] = (restored[table] ?? 0) + chunk.length;
    }
  }
  await admin.from('activity_logs').insert({ user_id: user.id, event_type: 'ADMIN_BACKUP_RESTORED', entity_type: 'backup', metadata: { version: backupVersion, restored, errors, rowsTotal } });
  if (Object.keys(errors).length) return NextResponse.json({ error: 'Backup partially restored. Some tables were skipped to protect data integrity.', restored, errors }, { status: 207 });
  return NextResponse.json({ restored, message: 'Backup restored safely as a merge.' });
}
