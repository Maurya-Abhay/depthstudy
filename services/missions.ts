import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import type {
  LearningMission,
  LearningMissionItem,
  MissionStatus,
  MissionItemType,
  MissionItemStatus,
} from '@/types/assessments';
import { getUserSkillGaps } from '@/services/skill-gap';
import { getMistakeIntelligence } from '@/services/mistakes';
import type { SkillGap } from '@/types/skills';
import type { MistakeAggregation } from '@/types/assessments';

interface MissionContext {
  gaps: SkillGap[];
  topMistakes: MistakeAggregation[];
  weakSkillIds: string[];
  inactiveSkillIds: string[];
}

function buildMissionDescription(ctx: MissionContext): string {
  const parts: string[] = [];
  if (ctx.weakSkillIds.length > 0) {
    parts.push(ctx.weakSkillIds.length + ' skill' + (ctx.weakSkillIds.length > 1 ? 's' : '') + ' need attention');
  }
  if (ctx.topMistakes.length > 0) {
    parts.push(ctx.topMistakes[0].count + ' recent ' + ctx.topMistakes[0].label + ' mistakes');
  }
  if (ctx.inactiveSkillIds.length > 0) {
    parts.push(ctx.inactiveSkillIds.length + ' inactive skill' + (ctx.inactiveSkillIds.length > 1 ? 's' : ''));
  }
  return parts.length > 0 ? parts.join('. ') + '.' : 'Keep up your learning streak.';
}

async function buildMissionContext(userId: string): Promise<MissionContext> {
  const [gapsResult, mistakesResult] = await Promise.all([
    getUserSkillGaps(userId).catch(() => null),
    getMistakeIntelligence(userId).catch(() => null),
  ]);

  const gaps = gapsResult?.gaps ?? [];
  const topMistakes = mistakesResult?.topCategories ?? [];

  const weakSkillIds = gaps
    .filter((g) => g.gapScore > 30)
    .sort((a, b) => b.gapScore - a.gapScore)
    .map((g) => g.skill.id);

  const admin = createAdminSupabaseClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: inactiveData } = await admin
    .from('user_skill_mastery')
    .select('skill_id, last_activity_at')
    .eq('user_id', userId);

  const inactiveSkillIds = (inactiveData ?? [])
    .filter((row: { skill_id: string; last_activity_at: string | null }) =>
      !row.last_activity_at || row.last_activity_at < sevenDaysAgo
    )
    .map((row: { skill_id: string }) => row.skill_id);

  return { gaps, topMistakes, weakSkillIds, inactiveSkillIds };
}

function generateMissionItems(ctx: MissionContext): Array<{
  position: number;
  itemType: MissionItemType;
  skillId: string | null;
  topicId: string | null;
  dsaProblemId: string | null;
  targetMinutes: number;
}> {
  const items: Array<{
    position: number;
    itemType: MissionItemType;
    skillId: string | null;
    topicId: string | null;
    dsaProblemId: string | null;
    targetMinutes: number;
  }> = [];

  let position = 1;

  for (const skillId of ctx.weakSkillIds.slice(0, 2)) {
    items.push({ position: position++, itemType: 'review', skillId, topicId: null, dsaProblemId: null, targetMinutes: 15 });
  }

  for (const mistake of ctx.topMistakes.slice(0, 2)) {
    const relatedGap = ctx.gaps.find((g) => g.gapScore > 20 && g.skill.category !== 'general');
    if (relatedGap) {
      items.push({ position: position++, itemType: 'practice', skillId: relatedGap.skill.id, topicId: null, dsaProblemId: null, targetMinutes: 20 });
    }
  }

  items.push({ position: position++, itemType: 'dsa', skillId: null, topicId: null, dsaProblemId: null, targetMinutes: 30 });

  for (const skillId of ctx.inactiveSkillIds.slice(0, 1)) {
    if (items.length >= 6) break;
    items.push({ position: position++, itemType: 'lesson', skillId, topicId: null, dsaProblemId: null, targetMinutes: 10 });
  }

  if (items.length >= 3) {
    items.push({ position: position++, itemType: 'assessment', skillId: ctx.weakSkillIds[0] ?? null, topicId: null, dsaProblemId: null, targetMinutes: 15 });
  }

  return items.slice(0, 6);
}

export async function generateDailyMission(userId: string, missionDate?: string): Promise<LearningMission> {
  const admin = createAdminSupabaseClient();
  const date = missionDate ?? new Date().toISOString().slice(0, 10);

  const { data: existing } = await admin
    .from('learning_missions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_date', date)
    .maybeSingle();

  if (existing) {
    return getMissionWithItems(existing.id, userId);
  }

  const ctx = await buildMissionContext(userId);
  const items = generateMissionItems(ctx);

  const title = ctx.weakSkillIds.length > 0
    ? 'Master ' + (ctx.gaps.find((g) => g.skill.id === ctx.weakSkillIds[0])?.skill.name ?? 'your skills')
    : ctx.topMistakes.length > 0
      ? 'Fix ' + ctx.topMistakes[0].label + ' mistakes'
      : 'Daily practice session';

  const description = buildMissionDescription(ctx);

  const { data: mission, error: missionError } = await admin
    .from('learning_missions')
    .insert({
      user_id: userId,
      mission_date: date,
      title,
      description,
      status: 'planned',
      generated_by: 'rule',
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (missionError) throw new Error(missionError.message);

  if (items.length > 0) {
    await admin.from('learning_mission_items').insert(
      items.map((item) => ({
        mission_id: mission.id,
        position: item.position,
        item_type: item.itemType,
        skill_id: item.skillId,
        topic_id: item.topicId,
        dsa_problem_id: item.dsaProblemId,
        target_minutes: item.targetMinutes,
        status: 'pending',
      }))
    );
  }

  return getMissionWithItems(mission.id, userId);
}

export async function getMissionWithItems(missionId: string, userId: string): Promise<LearningMission> {
  const supabase = await createServerSupabaseClient();

  const { data: mission, error } = await supabase
    .from('learning_missions')
    .select('id, user_id, mission_date, title, description, status, generated_by, created_at, updated_at')
    .eq('id', missionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !mission) throw new Error(error?.message || 'Mission not found');

  const items = await getMissionItems(mission.id, userId);

  return {
    id: mission.id,
    userId: mission.user_id,
    missionDate: mission.mission_date,
    title: mission.title,
    description: mission.description,
    status: mission.status as MissionStatus,
    generatedBy: mission.generated_by as 'rule' | 'ai',
    createdAt: mission.created_at,
    updatedAt: mission.updated_at,
    items,
  };
}

export async function getMissionItems(missionId: string, userId: string): Promise<LearningMissionItem[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('learning_mission_items')
    .select('id, mission_id, position, item_type, skill_id, topic_id, dsa_problem_id, assessment_id, target_minutes, status, completed_at')
    .eq('mission_id', missionId)
    .order('position');

  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    missionId: row.mission_id as string,
    position: row.position as number,
    itemType: row.item_type as MissionItemType,
    skillId: row.skill_id as string | null,
    topicId: row.topic_id as string | null,
    dsaProblemId: row.dsa_problem_id as string | null,
    assessmentId: row.assessment_id as string | null,
    targetMinutes: row.target_minutes as number,
    status: row.status as MissionItemStatus,
    completedAt: row.completed_at as string | null,
  }));
}

export async function updateMissionStatus(
  missionId: string,
  userId: string,
  status: MissionStatus,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('learning_missions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', missionId)
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateMissionItemStatus(
  itemId: string,
  userId: string,
  status: MissionItemStatus,
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabaseClient();
  const update: Record<string, unknown> = { status };
  if (status === 'completed') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await admin
    .from('learning_mission_items')
    .update(update)
    .eq('id', itemId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getTodayMission(userId: string): Promise<LearningMission | null> {
  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from('learning_missions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_date', today)
    .maybeSingle();

  if (!data) return null;
  return getMissionWithItems(data.id, userId);
}

export async function getMissionForDate(userId: string, date: string): Promise<LearningMission | null> {
  const admin = createAdminSupabaseClient();

  const { data } = await admin
    .from('learning_missions')
    .select('id')
    .eq('user_id', userId)
    .eq('mission_date', date)
    .maybeSingle();

  if (!data) return null;
  return getMissionWithItems(data.id, userId);
}

export async function getMissionsForDateRange(userId: string, from: string, to: string): Promise<LearningMission[]> {
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from('learning_missions')
    .select('id')
    .eq('user_id', userId)
    .gte('mission_date', from)
    .lte('mission_date', to)
    .order('mission_date', { ascending: false });

  if (error || !data) return [];

  const missions: LearningMission[] = [];
  for (const row of data) {
    const mission = await getMissionWithItems(row.id, userId);
    if (mission) missions.push(mission);
  }
  return missions;
}
