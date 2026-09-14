import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import type {
  AdaptiveAssessment,
  AdaptiveAssessmentItem,
  AdaptiveAssessmentStatus,
  ClientSafeQuestion,
} from '@/types/assessments';

const CLIENT_QUESTION_SELECT = "id, category_id, topic_id, prompt, type, options, explanation, published";

function mapClientQuestion(row: Record<string, unknown>): ClientSafeQuestion {
  return {
    id: row.id as string,
    categoryId: row.category_id as string | null,
    topicId: row.topic_id as string | null,
    prompt: row.prompt as string,
    type: row.type as string,
    options: Array.isArray(row.options) ? row.options : [],
    explanation: (row.explanation as string) ?? "",
    published: row.published as boolean,
  };
}

function adjustDifficulty(currentDifficulty: number, isCorrect: boolean): number {
  if (isCorrect) return Math.min(5, currentDifficulty + 1);
  return Math.max(1, currentDifficulty - 1);
}

export async function createAdaptiveAssessment(
  userId: string,
  blueprintId?: string | null,
  skillId?: string | null,
): Promise<{ assessment: AdaptiveAssessment; question: ClientSafeQuestion | null }> {
  const admin = createAdminSupabaseClient();

  const { data: assessment, error } = await admin
    .from("adaptive_assessments")
    .insert({
      user_id: userId,
      blueprint_id: blueprintId ?? null,
      status: "active",
      current_difficulty: 2,
    })
    .select("id, user_id, blueprint_id, status, current_difficulty, score, started_at, submitted_at")
    .single();

  if (error) throw new Error(error.message);

  // Pick first question at difficulty 2
  const { data: question } = await admin
    .from("questions")
    .select(CLIENT_QUESTION_SELECT)
    .eq("published", true)
    .eq("difficulty", 2)
    .limit(1)
    .maybeSingle();

  if (question) {
    await admin.from("adaptive_assessment_items").insert({
      assessment_id: assessment.id,
      question_id: question.id,
      position: 1,
      difficulty: 2,
    });
  }

  return {
    assessment: {
      id: assessment.id,
      userId: assessment.user_id,
      blueprintId: assessment.blueprint_id ?? null,
      status: assessment.status as AdaptiveAssessmentStatus,
      currentDifficulty: assessment.current_difficulty,
      score: assessment.score ?? null,
      startedAt: assessment.started_at,
      submittedAt: assessment.submitted_at ?? null,
    },
    question: question ? mapClientQuestion(question) : null,
  };
}

export async function getNextQuestion(
  assessmentId: string,
  userId: string,
): Promise<ClientSafeQuestion | null> {
  const supabase = await createServerSupabaseClient();

  const { data: assessment } = await supabase
    .from("adaptive_assessments")
    .select("id, current_difficulty, status")
    .eq("id", assessmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!assessment || assessment.status !== "active") return null;

  const { data: nextItem } = await supabase
    .from("adaptive_assessment_items")
    .select("id, question_id, difficulty")
    .eq("assessment_id", assessmentId)
    .eq("answered", false)
    .order("position")
    .limit(1)
    .maybeSingle();

  if (!nextItem) return null;

  const { data: question } = await supabase
    .from("questions")
    .select(CLIENT_QUESTION_SELECT)
    .eq("id", nextItem.question_id)
    .maybeSingle();

  return question ? mapClientQuestion(question) : null;
}

export async function submitAnswer(
  assessmentId: string,
  userId: string,
  questionId: string,
  userAnswer: unknown,
): Promise<{ correct: boolean; nextDifficulty: number }> {
  const admin = createAdminSupabaseClient();

  const supabase = await createServerSupabaseClient();
  const { data: assessment } = await supabase
    .from("adaptive_assessments")
    .select("id, current_difficulty, status")
    .eq("id", assessmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!assessment || assessment.status !== "active") {
    throw new Error("Assessment not found or not active.");
  }

  // Get the correct answer (server-side only, never sent to client)
  const { data: question } = await admin
    .from("questions")
    .select("answer")
    .eq("id", questionId)
    .maybeSingle();

  if (!question) throw new Error("Question not found.");

  const correctAnswer = question.answer;
  const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);

  await admin
    .from("adaptive_assessment_items")
    .update({ answered: true, is_correct: isCorrect })
    .eq("assessment_id", assessmentId)
    .eq("question_id", questionId);

  const nextDifficulty = adjustDifficulty(assessment.current_difficulty, isCorrect);
  await admin
    .from("adaptive_assessments")
    .update({ current_difficulty: nextDifficulty })
    .eq("id", assessmentId);

  // Pick next question at new difficulty
  const { data: nextQuestion } = await admin
    .from("questions")
    .select("id")
    .eq("published", true)
    .eq("difficulty", nextDifficulty)
    .limit(1)
    .maybeSingle();

  if (nextQuestion) {
    const { data: maxPos } = await admin
      .from("adaptive_assessment_items")
      .select("position")
      .eq("assessment_id", assessmentId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPosition = (maxPos?.position ?? 0) + 1;

    await admin.from("adaptive_assessment_items").insert({
      assessment_id: assessmentId,
      question_id: nextQuestion.id,
      position: nextPosition,
      difficulty: nextDifficulty,
    });
  }

  return { correct: isCorrect, nextDifficulty };
}

export async function finalizeAssessment(
  assessmentId: string,
  userId: string,
): Promise<{ score: number; totalQuestions: number; correctAnswers: number }> {
  const admin = createAdminSupabaseClient();

  const { data: items } = await admin
    .from("adaptive_assessment_items")
    .select("id, answered, is_correct")
    .eq("assessment_id", assessmentId);

  if (!items || items.length === 0) {
    return { score: 0, totalQuestions: 0, correctAnswers: 0 };
  }

  const answeredItems = items.filter((i: { answered: boolean }) => i.answered);
  const correctAnswers = answeredItems.filter((i: { is_correct: boolean }) => i.is_correct).length;
  const totalQuestions = answeredItems.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  await admin
    .from("adaptive_assessments")
    .update({
      status: "submitted",
      score,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", assessmentId)
    .eq("user_id", userId);

  return { score, totalQuestions, correctAnswers };
}

export async function getAssessmentWithItems(
  assessmentId: string,
  userId: string,
): Promise<{ assessment: AdaptiveAssessment; items: AdaptiveAssessmentItem[] } | null> {
  const supabase = await createServerSupabaseClient();

  const { data: assessment, error } = await supabase
    .from("adaptive_assessments")
    .select("id, user_id, blueprint_id, status, current_difficulty, score, started_at, submitted_at")
    .eq("id", assessmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !assessment) return null;

  const { data: items } = await supabase
    .from("adaptive_assessment_items")
    .select("id, assessment_id, question_id, position, difficulty, answered, is_correct")
    .eq("assessment_id", assessmentId)
    .order("position");

  return {
    assessment: {
      id: assessment.id,
      userId: assessment.user_id,
      blueprintId: assessment.blueprint_id ?? null,
      status: assessment.status as AdaptiveAssessmentStatus,
      currentDifficulty: assessment.current_difficulty,
      score: assessment.score ?? null,
      startedAt: assessment.started_at,
      submittedAt: assessment.submitted_at ?? null,
    },
    items: (items ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      assessmentId: row.assessment_id as string,
      questionId: row.question_id as string,
      position: row.position as number,
      difficulty: row.difficulty as number,
      answered: row.answered as boolean,
      isCorrect: row.is_correct as boolean | null,
    })),
  };
}

/**
 * Alias for getAssessmentWithItems — used by the API route.
 */
export async function getAssessmentResult(
  assessmentId: string,
  userId: string,
): Promise<{ assessment: AdaptiveAssessment; items: AdaptiveAssessmentItem[] } | null> {
  return getAssessmentWithItems(assessmentId, userId);
}

export async function submitAssessment(
  userId: string,
  assessmentId: string,
): Promise<{ ok: boolean; score?: number; total?: number; correct?: number; error?: string }> {
  const admin = createAdminSupabaseClient();

  // Verify ownership and get assessment
  const { data: assessment, error: fetchError } = await admin
    .from('adaptive_assessments')
    .select('id, status, blueprint_id')
    .eq('id', assessmentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError || !assessment) {
    return { ok: false, error: 'Assessment not found.' };
  }
  if (assessment.status !== 'active') {
    return { ok: false, error: 'Assessment is not active.' };
  }

  // Calculate score from answered items
  const { data: items } = await admin
    .from('adaptive_assessment_items')
    .select('id, answered, is_correct')
    .eq('assessment_id', assessmentId);

  const totalQuestions = items?.length ?? 0;
  const answeredItems = items?.filter((i: { answered: boolean }) => i.answered) ?? [];
  const correctAnswers = answeredItems.filter((i: { is_correct: boolean }) => i.is_correct).length;

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Mark assessment as submitted
  await admin
    .from('adaptive_assessments')
    .update({
      status: 'submitted',
      score,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', assessmentId)
    .eq('user_id', userId);

  // Record skill events if blueprint has a skill
  if (assessment.blueprint_id) {
    const { data: blueprint } = await admin
      .from('assessment_blueprints')
      .select('skill_id')
      .eq('id', assessment.blueprint_id)
      .maybeSingle();

    if (blueprint?.skill_id) {
      const { recordSkillEvent } = await import('@/services/skills');
      await recordSkillEvent({
        userId,
        skillId: blueprint.skill_id,
        eventType: score >= 70 ? 'test_passed' : 'test_attempt',
        score,
        source: 'assessment',
        entityType: 'adaptive_assessment',
        entityId: assessmentId,
      });
    }
  }

  return { ok: true, score, total: totalQuestions, correct: correctAnswers };
}
