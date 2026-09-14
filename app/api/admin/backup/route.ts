import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { rateLimit, rateLimitedResponse } from '@/services/security';

const tables = [
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
  'activity_logs',
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
  'organizations',
  'organization_plan_definitions',
  'organization_members',
  'organization_billing_profiles',
  'organization_provisioning',
  'organization_feature_entitlements',
  'organization_subscriptions',
  'organization_departments',
  'organization_batches',
  'batch_members',
  'faculty_assignments',
  'organization_assignments',
  'organization_invites',
  'organization_audit_logs',
  'assignment_attempts',
  'organization_skill_snapshots',
  'organization_placement_snapshots',
  'organization_invoices',
  'organization_invoice_items',
  'organization_payments',
  'billing_events',
  'organization_usage',
  'organization_usage_events',
  'organization_import_jobs',
  'organization_import_rows',
  'organization_entitlements',
  'user_entitlements',
] as const;

export async function GET(request: Request) {
  const limiter = rateLimit(request, { key: 'admin-backup', limit: 2, windowMs: 10 * 60_000 });
  if (!limiter.allowed) return rateLimitedResponse(limiter.retryAfter);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch (error) {
    return NextResponse.json({ error: 'Backup service is not configured.' }, { status: 503 });
  }

  const result: Record<string, unknown[]> = {};
  const errors: Record<string, string> = {};
  await Promise.all(tables.map(async (table) => {
    const { data, error } = await admin.from(table).select('*');
    if (error) errors[table] = error.message;
    else result[table] = data ?? [];
  }));

  if (Object.keys(errors).length) return NextResponse.json({ error: 'Backup could not include every table.', tables: result, errors }, { status: 502 });

  await admin.from('activity_logs').insert({ user_id: user.id, event_type: 'ADMIN_BACKUP_EXPORTED', entity_type: 'backup', metadata: { tables: tables.length, version: 2 } });
  const backup = { version: 2, generatedAt: new Date().toISOString(), tables: result };
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="depth-study-backup-${new Date().toISOString().slice(0, 10)}.json"`,
      'cache-control': 'no-store',
    },
  });
}