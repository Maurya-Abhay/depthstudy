import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { getUserPlan, canUsePremiumProject } from '@/services/entitlements';

export async function getPublishedProjects() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('projects').select('id,title,slug,description,difficulty,skills,requirements,starter_repo_url,published,premium,created_at').eq('published', true).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUserProjects(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('project_enrollments').select('*, projects(id,title,slug,description,difficulty,skills,requirements,starter_repo_url,premium)').eq('user_id', userId).order('started_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProjectWorkspace(userId: string, enrollmentId: string) {
  const admin = createAdminSupabaseClient();
  const enrollment = await admin.from('project_enrollments').select('*, projects(id,title,slug,description,difficulty,skills,requirements,starter_repo_url,premium,published)').eq('id', enrollmentId).eq('user_id', userId).maybeSingle();
  if (enrollment.error) throw new Error(enrollment.error.message);
  if (!enrollment.data) throw new Error('Project enrollment not found');
  const milestones = await admin.from('project_milestones').select('id,title,description,sort_order,target_minutes,required').eq('project_id', enrollment.data.project_id).order('sort_order');
  if (milestones.error) throw new Error(milestones.error.message);
  const progress = await admin.from('project_milestone_progress').select('milestone_id,status,completed_at').eq('enrollment_id', enrollmentId).eq('user_id', userId);
  if (progress.error) throw new Error(progress.error.message);
  return { enrollment: enrollment.data, milestones: milestones.data ?? [], progress: progress.data ?? [] };
}

export async function updateMilestone(userId: string, enrollmentId: string, milestoneId: string, status: 'pending'|'active'|'completed') {
  const admin = createAdminSupabaseClient();
  const own = await admin.from('project_enrollments').select('id,project_id').eq('id', enrollmentId).eq('user_id', userId).maybeSingle();
  if (!own.data) throw new Error('Project enrollment not found');
  const milestone = await admin.from('project_milestones').select('id').eq('id', milestoneId).eq('project_id', own.data.project_id).maybeSingle();
  if (!milestone.data) throw new Error('Project milestone not found');
  const { data, error } = await admin.from('project_milestone_progress').upsert({ user_id: userId, enrollment_id: enrollmentId, milestone_id: milestoneId, status, completed_at: status === 'completed' ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: 'user_id,milestone_id' }).select('*').single();
  if (error) throw new Error(error.message);
  const all = await admin.from('project_milestones').select('id,required').eq('project_id', own.data.project_id);
  const done = await admin.from('project_milestone_progress').select('milestone_id').eq('user_id', userId).eq('enrollment_id', enrollmentId).eq('status','completed');
  const requiredCount = (all.data ?? []).filter((m:any)=>m.required).length;
  const doneCount = new Set((done.data ?? []).map((m:any)=>m.milestone_id)).size;
  const progress = requiredCount ? Math.round((doneCount / requiredCount) * 100) : 0;
  await admin.from('project_enrollments').update({ progress }).eq('id', enrollmentId).eq('user_id', userId);
  return { progress: data, overallProgress: progress };
}

export async function enrollProject(userId: string, projectId: string) {
  const admin = createAdminSupabaseClient();
  const project = await admin.from('projects').select('id,published,premium').eq('id', projectId).maybeSingle();
  if (!project.data || !project.data.published) throw new Error('Project is not available');
  const plan = await getUserPlan(userId);
  if (!canUsePremiumProject(plan, Boolean(project.data.premium))) throw new Error('This project requires Pro access');
  const { data, error } = await admin.from('project_enrollments').upsert({ user_id: userId, project_id: projectId, status: 'active', progress: 0 }, { onConflict: 'user_id,project_id' }).select('*').single();
  if (error) throw new Error(error.message);
  const milestones = await admin.from('project_milestones').select('id,sort_order').eq('project_id', projectId).order('sort_order');
  if (!milestones.error && milestones.data?.length) {
    const seed = milestones.data.slice(0,1).map((m:any)=>({ user_id:userId, enrollment_id:data.id, milestone_id:m.id, status:'active' }));
    if (seed.length) await admin.from('project_milestone_progress').upsert(seed, { onConflict:'user_id,milestone_id' });
  }
  return data;
}

export async function submitProject(userId: string, input: { enrollmentId: string; projectId: string; repoUrl?: string; demoUrl?: string; notes?: string }) {
  const admin = createAdminSupabaseClient();
  const own = await admin.from('project_enrollments').select('id,project_id,status,progress').eq('id', input.enrollmentId).eq('user_id', userId).maybeSingle();
  if (!own.data || own.data.project_id !== input.projectId) throw new Error('Project enrollment not found');
  if (own.data.progress < 100) throw new Error('Complete all required project milestones before submitting');
  if (input.repoUrl && !/^https?:\/\//i.test(input.repoUrl)) throw new Error('Repository URL must be http(s)');
  if (input.demoUrl && !/^https?:\/\//i.test(input.demoUrl)) throw new Error('Demo URL must be http(s)');
  const { data, error } = await admin.from('project_submissions').insert({
    enrollment_id: input.enrollmentId, user_id: userId, project_id: input.projectId, repo_url: input.repoUrl ?? null, demo_url: input.demoUrl ?? null, notes: String(input.notes ?? '').slice(0, 10000), status:'pending'
  }).select('*').single();
  if (error) throw new Error(error.message);
  await admin.from('project_enrollments').update({ status: 'submitted' }).eq('id', input.enrollmentId).eq('user_id', userId);
  return data;
}
