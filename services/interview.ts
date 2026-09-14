import 'server-only';
import { createAdminSupabaseClient } from '@/services/supabase-admin';

function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }

function rubricScore(answer: string, expected: unknown): number {
  const text = answer.trim().toLowerCase();
  if (!text) return 0;
  const points = Array.isArray(expected) ? expected.map(String).map((x) => x.trim().toLowerCase()).filter(Boolean) : [];
  if (!points.length) return clamp(40 + Math.min(60, Math.round(text.length / 12)));
  const hits = points.filter((point) => text.includes(point)).length;
  const coverage = hits / points.length;
  const depth = Math.min(20, Math.floor(text.length / 80) * 5);
  return clamp(Math.round(coverage * 80) + depth);
}

export async function getInterviewTracks() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('interview_tracks').select('id,name,slug,description').eq('published', true).order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function startInterview(userId: string, trackId: string | null, mode: 'practice' | 'mock') {
  const admin = createAdminSupabaseClient();
  if (trackId) {
    const track = await admin.from('interview_tracks').select('id').eq('id', trackId).eq('published', true).maybeSingle();
    if (!track.data) throw new Error('Interview track not found');
  }
  const { data, error } = await admin.from('interview_sessions').insert({ user_id: userId, track_id: trackId, mode, status: 'active' }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getNextInterviewQuestion(userId: string, sessionId: string) {
  const admin = createAdminSupabaseClient();
  const session = await admin.from('interview_sessions').select('id,track_id,status,mode').eq('id', sessionId).eq('user_id', userId).maybeSingle();
  if (!session.data) throw new Error('Interview session not found');
  if (session.data.status !== 'active') throw new Error('Interview session is no longer active');
  const answeredCount = await admin.from('interview_answers').select('id', { count: 'exact', head: true }).eq('session_id', sessionId).eq('user_id', userId);
  const questionCap = session.data.mode === 'mock' ? 10 : 5;
  if ((answeredCount.count ?? 0) >= questionCap) return null;
  const answered = await admin.from('interview_answers').select('question_id').eq('session_id', sessionId).eq('user_id', userId);
  const answeredIds = (answered.data ?? []).map((x) => x.question_id);
  let query = admin.from('interview_questions').select('id,track_id,category,prompt,difficulty').eq('published', true).order('difficulty').limit(50);
  if (session.data.track_id) query = query.eq('track_id', session.data.track_id);
  const result = await query.limit(25);
  if (result.error) throw new Error(result.error.message);
  const next = (result.data ?? []).find((q) => !answeredIds.includes(q.id));
  if (!next) return null;
  return next;
}

export async function submitInterviewAnswer(userId: string, input: { sessionId: string; questionId: string; answer: string }) {
  const admin = createAdminSupabaseClient();
  const session = await admin.from('interview_sessions').select('id,status,track_id').eq('id', input.sessionId).eq('user_id', userId).maybeSingle();
  if (!session.data || session.data.status !== 'active') throw new Error('Interview session not found or inactive');
  const question = await admin.from('interview_questions').select('id,expected_points,track_id').eq('id', input.questionId).eq('published', true).maybeSingle();
  if (!question.data) throw new Error('Interview question not found');
  if (session.data.track_id && question.data.track_id !== session.data.track_id) throw new Error('Question does not belong to this interview track');
  const score = rubricScore(input.answer, question.data.expected_points);
  const feedback = score >= 75 ? 'Strong answer. Keep the structure concise and evidence-driven.' : score >= 50 ? 'Good start. Add more concrete reasoning, trade-offs, and examples.' : 'Focus on the core concept, explain your reasoning, and include a concrete example.';
  const { data, error } = await admin.from('interview_answers').upsert({ user_id: userId, session_id: input.sessionId, question_id: input.questionId, answer: input.answer.slice(0, 12000), score, feedback }, { onConflict: 'session_id,question_id' }).select('id,session_id,question_id,score,feedback,created_at').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function finishInterview(userId: string, sessionId: string) {
  const admin = createAdminSupabaseClient();
  const session = await admin.from('interview_sessions').select('id,status').eq('id', sessionId).eq('user_id', userId).maybeSingle();
  if (!session.data) throw new Error('Interview session not found');
  const answers = await admin.from('interview_answers').select('score').eq('session_id', sessionId).eq('user_id', userId);
  if (answers.error) throw new Error(answers.error.message);
  const scores = (answers.data ?? []).map((row) => Number(row.score)).filter(Number.isFinite);
  const score = scores.length ? clamp(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const { data, error } = await admin.from('interview_sessions').update({ status: 'completed', score, submitted_at: new Date().toISOString() }).eq('id', sessionId).eq('user_id', userId).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function calculatePlacementReadiness(userId: string) {
  const admin = createAdminSupabaseClient();
  const skillRows = await admin.from('user_skill_mastery').select('mastery_score, skills(name)').eq('user_id', userId);
  if (skillRows.error) throw new Error(skillRows.error.message);
  const skills = skillRows.data ?? [];
  const dsa = skills.filter((row: any) => String(row.skills?.name ?? '').toLowerCase().includes('dsa')).map((row: any) => Number(row.mastery_score));
  const allSkills = skills.map((row: any) => Number(row.mastery_score));
  const dsaScore = dsa.length ? dsa.reduce((a, b) => a + b, 0) / dsa.length : 0;
  const overallSkill = allSkills.length ? allSkills.reduce((a, b) => a + b, 0) / allSkills.length : 0;
  const interviewRows = await admin.from('interview_sessions').select('score').eq('user_id', userId).eq('status', 'completed').order('submitted_at', { ascending: false }).limit(5);
  const interviewScores = (interviewRows.data ?? []).map((row) => Number(row.score)).filter(Number.isFinite);
  const interviewScore = interviewScores.length ? interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length : 0;
  const projectRows = await admin.from('project_submissions').select('score').eq('user_id', userId).eq('status', 'approved').limit(20);
  const projectScores = (projectRows.data ?? []).map((row) => Number(row.score)).filter(Number.isFinite);
  const projectsScore = projectScores.length ? projectScores.reduce((a, b) => a + b, 0) / projectScores.length : 0;
  const readiness = clamp((overallSkill * 0.45) + (dsaScore * 0.2) + (interviewScore * 0.2) + (projectsScore * 0.15));
  const gaps = skills.filter((row: any) => Number(row.mastery_score) < 60).slice(0, 5).map((row: any) => row.skills?.name ?? 'Skill gap');
  const strengths = skills.filter((row: any) => Number(row.mastery_score) >= 75).slice(0, 5).map((row: any) => row.skills?.name ?? 'Strength');
  const { data, error } = await admin.from('placement_readiness_snapshots').insert({ user_id: userId, overall_score: readiness, dsa_score: clamp(dsaScore), core_cs_score: clamp(overallSkill), projects_score: clamp(projectsScore), assessment_score: clamp(overallSkill), interview_score: clamp(interviewScore), consistency_score: clamp(overallSkill), gaps, strengths }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getLatestPlacementReadiness(userId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from('placement_readiness_snapshots').select('*').eq('user_id', userId).order('calculated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
