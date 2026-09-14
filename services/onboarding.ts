import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import {
  UserOnboarding,
  OnboardingInput,
  OnboardingStatus,
  OnboardingInterest,
  OnboardingLevel,
  OnboardingGoal,
  ONBOARDING_INTERESTS,
  ONBOARDING_GOALS,
} from '@/types/onboarding';
import { recalculateSkillMastery } from '@/services/skills';
import { getUserSkillGaps } from '@/services/skill-gap';
import { generateDailyMission } from '@/services/missions';

// ── Validation ──────────────────────────────────────────────────────────────

function validateOnboardingInput(input: Partial<OnboardingInput>): {
  valid: boolean;
  errors: string[];
  sanitized?: OnboardingInput;
} {
  const errors: string[] = [];

    const interests = Array.isArray(input.interests)
    ? input.interests.filter((i): i is OnboardingInterest =>
        typeof i === 'string' && ONBOARDING_INTERESTS.includes(i as OnboardingInterest)
      )
    : [];
  if (interests.length === 0) errors.push('At least one interest is required.');
  if (interests.length > 6) errors.push('Maximum 6 interests allowed.');

  const validLevels = ['beginner', 'intermediate', 'advanced'];
  const currentLevel = validLevels.includes(input.currentLevel ?? '')
    ? (input.currentLevel as OnboardingLevel)
    : 'beginner';

    const goals = Array.isArray(input.goals)
    ? input.goals.filter((g): g is OnboardingGoal =>
        typeof g === 'string' && ONBOARDING_GOALS.includes(g as OnboardingGoal)
      )
    : [];
  if (goals.length === 0) errors.push('At least one goal is required.');
  if (goals.length > 4) errors.push('Maximum 4 goals allowed.');

  const validMinutes = [15, 30, 45, 60, 90];
  const dailyMinutes = validMinutes.includes(input.dailyMinutes as number)
    ? (input.dailyMinutes as 15 | 30 | 45 | 60 | 90)
    : 30;

  const validStyles = ['concept_first', 'practice_first', 'balanced'];
  const learningStyle = validStyles.includes(input.learningStyle ?? '')
    ? (input.learningStyle as 'concept_first' | 'practice_first' | 'balanced')
    : 'balanced';

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    errors: [],
    sanitized: { interests, currentLevel, goals, dailyMinutes, learningStyle },
  };
}

// ── Onboarding CRUD ─────────────────────────────────────────────────────────

export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('user_id, onboarding_completed, diagnostic_completed')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return { userId, isCompleted: false, hasDiagnostic: false, needsOnboarding: true };
  }

  return {
    userId,
    isCompleted: data.onboarding_completed ?? false,
    hasDiagnostic: data.diagnostic_completed ?? false,
    needsOnboarding: !(data.onboarding_completed ?? false),
  };
}

export async function getUserOnboarding(userId: string): Promise<UserOnboarding | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    userId: data.user_id,
    interests: data.interests ?? [],
    currentLevel: data.current_level,
    goals: data.goals ?? [],
    dailyMinutes: data.daily_minutes,
    learningStyle: data.learning_style,
    diagnosticCompleted: data.diagnostic_completed ?? false,
    diagnosticAssessmentId: data.diagnostic_assessment_id ?? null,
    onboardingCompleted: data.onboarding_completed ?? false,
    completedAt: data.completed_at ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function saveOnboarding(
  userId: string,
  input: Partial<OnboardingInput>,
): Promise<{ ok: boolean; errors?: string[]; data?: UserOnboarding }> {
  const validation = validateOnboardingInput(input);
  if (!validation.valid || !validation.sanitized) {
    return { ok: false, errors: validation.errors };
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('user_onboarding')
    .upsert({
      user_id: userId,
      interests: validation.sanitized.interests,
      current_level: validation.sanitized.currentLevel,
      goals: validation.sanitized.goals,
      daily_minutes: validation.sanitized.dailyMinutes,
      learning_style: validation.sanitized.learningStyle,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) return { ok: false, errors: [error.message] };

  return {
    ok: true,
    data: {
      userId: data.user_id,
      interests: data.interests ?? [],
      currentLevel: data.current_level,
      goals: data.goals ?? [],
      dailyMinutes: data.daily_minutes,
      learningStyle: data.learning_style,
      diagnosticCompleted: data.diagnostic_completed ?? false,
      diagnosticAssessmentId: data.diagnostic_assessment_id ?? null,
      onboardingCompleted: data.onboarding_completed ?? false,
      completedAt: data.completed_at ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}

// ── Complete onboarding ─────────────────────────────────────────────────────

export async function completeOnboarding(userId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from('user_onboarding')
    .update({
      onboarding_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Diagnostic flow ─────────────────────────────────────────────────────────

export async function runDiagnostic(userId: string): Promise<{
  ok: boolean;
  assessmentId?: string;
  error?: string;
}> {
  const admin = createAdminSupabaseClient();

  // Get user onboarding to determine interests/level
  const { data: onboarding } = await admin
    .from('user_onboarding')
    .select('interests, current_level')
    .eq('user_id', userId)
    .maybeSingle();

  if (!onboarding) {
    return { ok: false, error: 'Onboarding not found. Please complete onboarding first.' };
  }

  // Map interests to categories/skills
  const interestSlugs = mapInterestsToSlugs(onboarding.interests ?? []);
  const startDifficulty = mapLevelToDifficulty(onboarding.current_level);

  // Find questions matching interests at appropriate difficulty
      const { data: initialQuestions } = await admin
      .from('questions')
      .select('id, difficulty')
      .eq('published', true)
      .in('difficulty', getDifficultyRange(startDifficulty))
      .limit(10);

    let questions = initialQuestions;

    if (!questions || questions.length === 0) {
      // Fallback: get any published questions
      const { data: fallbackQuestions } = await admin
        .from('questions')
        .select('id, difficulty')
        .eq('published', true)
        .limit(10);

      if (!fallbackQuestions || fallbackQuestions.length === 0) {
        return { ok: false, error: 'No questions available for diagnostic.' };
      }

      questions = fallbackQuestions;
    }

  // Create assessment
  const { data: assessment, error: assessmentError } = await admin
    .from('adaptive_assessments')
    .insert({
      user_id: userId,
      status: 'active',
      current_difficulty: startDifficulty,
    })
    .select('id')
    .single();

  if (assessmentError) return { ok: false, error: assessmentError.message };

  // Create assessment items
  const items = questions.map((q: { id: string }, index: number) => ({
    assessment_id: assessment.id,
    question_id: q.id,
    position: index + 1,
    difficulty: startDifficulty,
  }));

  const { error: itemsError } = await admin
    .from('adaptive_assessment_items')
    .insert(items);

  if (itemsError) return { ok: false, error: itemsError.message };

  // Update onboarding with diagnostic assessment id
  await admin
    .from('user_onboarding')
    .update({
      diagnostic_assessment_id: assessment.id,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { ok: true, assessmentId: assessment.id };
}

function mapInterestsToSlugs(interests: string[]): string[] {
  const mapping: Record<string, string[]> = {
    'DSA': ['arrays', 'strings', 'linked-list', 'tree', 'graph', 'dynamic-programming', 'sorting', 'searching'],
    'Web Development': ['html', 'css', 'javascript', 'react', 'nodejs', 'web'],
    'JavaScript': ['javascript', 'es6', 'async', 'closures', 'prototypes'],
    'React': ['react', 'hooks', 'components', 'state-management', 'jsx'],
    'SQL': ['sql', 'database', 'queries', 'joins', 'normalization'],
    'Interview Preparation': ['dsa', 'system-design', 'behavioral', 'problem-solving'],
  };

  const slugs: string[] = [];
  for (const interest of interests) {
    const mapped = mapping[interest];
    if (mapped) slugs.push(...mapped);
  }
  return [...new Set(slugs)];
}

function mapLevelToDifficulty(level: string): number {
  if (level === 'advanced') return 3;
  if (level === 'intermediate') return 2;
  return 1;
}

function getDifficultyRange(level: number): number[] {
  if (level <= 1) return [1, 2];
  if (level === 2) return [2, 3];
  return [3, 4];
}

// ── Post-diagnostic: recalculate and generate mission ───────────────────────

export async function completeDiagnosticAndGenerateMission(userId: string): Promise<{
  ok: boolean;
  missionId?: string;
  error?: string;
}> {
  const admin = createAdminSupabaseClient();

  // Mark diagnostic as completed
  const { error: updateError } = await admin
    .from('user_onboarding')
    .update({
      diagnostic_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) return { ok: false, error: updateError.message };

  // Recalculate skill profile
  const { recalculateSkillMastery } = await import('@/services/skills');
  await recalculateSkillMastery(userId);

  // Calculate skill gaps
  const { getUserSkillGaps } = await import('@/services/skill-gap');
  await getUserSkillGaps(userId);

  // Generate first daily mission
  const { generateDailyMission } = await import('@/services/missions');
    const mission = await generateDailyMission(userId);

  return { ok: true, missionId: mission?.id };
}
