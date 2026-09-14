import 'server-only';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';

export type AISessionType = 'socratic_coach' | 'code_explanation' | 'mistake_explanation' | 'recommendation';

export interface AIMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount: number | null;
  createdAt: string;
}

export interface AISession {
  id: string;
  userId: string;
  sessionType: AISessionType;
  skillId: string | null;
  topicId: string | null;
  problemId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResult {
  ok: boolean;
  sessionId: string;
  reply?: string;
  error?: string;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct';
const TIMEOUT_MS = 45_000;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function callOpenRouter(messages: ChatMessage[]): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
        'X-Title': 'Depth Study',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 2000,
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createSession(
  userId: string,
  sessionType: AISessionType,
  context?: { skillId?: string; topicId?: string; problemId?: string },
): Promise<AISession | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('ai_sessions')
    .insert({
      user_id: userId,
      session_type: sessionType,
      skill_id: context?.skillId ?? null,
      topic_id: context?.topicId ?? null,
      problem_id: context?.problemId ?? null,
    })
    .select('id, user_id, session_type, skill_id, topic_id, problem_id, created_at, updated_at')
    .single();
  if (error || !data) return null;
  return {
    id: data.id, userId: data.user_id, sessionType: data.session_type as AISessionType,
    skillId: data.skill_id ?? null, topicId: data.topic_id ?? null, problemId: data.problem_id ?? null,
    createdAt: data.created_at, updatedAt: data.updated_at,
  };
}

export async function getSessionMessages(sessionId: string, userId: string): Promise<AIMessage[]> {
  const admin = createAdminSupabaseClient();
  const owner = await admin.from('ai_sessions').select('id').eq('id', sessionId).eq('user_id', userId).maybeSingle();
  if (!owner.data) return [];
  const { data, error } = await admin
    .from('ai_messages')
    .select('id, session_id, role, content, token_count, created_at')
    .eq('session_id', sessionId)
    .order('created_at');
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: row.id as string, sessionId: row.session_id as string,
    role: row.role as 'user' | 'assistant' | 'system',
    content: row.content as string, tokenCount: (row.token_count as number) ?? null,
    createdAt: row.created_at as string,
  }));
}

const SOCRATIC_SYSTEM = `You are a Socratic coding tutor. Guide the student to discover the answer themselves.

Rules:
1. NEVER give the complete solution immediately.
2. Ask one guiding question at a time.
3. If stuck, provide a small hint (not the answer).
4. Only reveal the full solution after genuine effort or explicit request.
5. Be encouraging and patient.
6. Keep responses concise (2-4 sentences).
7. Use the student's current mistake or context to tailor guidance.`;

export async function sendSocraticMessage(
  sessionId: string, userId: string, userMessage: string,
  context?: { skillName?: string; mistakeCategory?: string; problemTitle?: string },
): Promise<SendMessageResult> {
  const admin = createAdminSupabaseClient();
  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'user', content: userMessage.slice(0, 4000) });

  let contextInfo = '';
  if (context?.skillName) contextInfo += `\nSkill: ${context.skillName}`;
  if (context?.mistakeCategory) contextInfo += `\nMistake category: ${context.mistakeCategory}`;
  if (context?.problemTitle) contextInfo += `\nProblem: ${context.problemTitle}`;

  const systemContent = contextInfo ? `${SOCRATIC_SYSTEM}\n\nCurrent context:${contextInfo}` : SOCRATIC_SYSTEM;
  const history = await getSessionMessages(sessionId, userId);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  const reply = await callOpenRouter(messages);
  if (!reply) return { ok: false, sessionId, error: 'AI service unavailable.' };

  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'assistant', content: reply.slice(0, 8000) });
  await admin.from('ai_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  return { ok: true, sessionId, reply };
}

const CODE_EXPLAIN_SYSTEM = `You are a code explanation assistant. Explain code clearly and accurately.

Rules:
1. Break down the code step by step.
2. Identify time and space complexity.
3. Point out potential bugs or edge cases.
4. Suggest improvements if applicable.
5. Keep explanations concise but thorough.
6. NEVER execute or run any code.
7. Use markdown formatting for readability.`;

export async function explainCode(
  sessionId: string, userId: string, code: string, language?: string,
): Promise<SendMessageResult> {
  const admin = createAdminSupabaseClient();
  const userMessage = `Explain this ${language || 'code'}:\n\n\`\`\`${language || ''}\n${code.slice(0, 6000)}\n\`\`\``;
  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'user', content: userMessage });

  const messages: ChatMessage[] = [
    { role: 'system', content: CODE_EXPLAIN_SYSTEM },
    { role: 'user', content: userMessage },
  ];
  const reply = await callOpenRouter(messages);
  if (!reply) return { ok: false, sessionId, error: 'AI service unavailable.' };

  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'assistant', content: reply.slice(0, 8000) });
  await admin.from('ai_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  return { ok: true, sessionId, reply };
}

const MISTAKE_EXPLAIN_SYSTEM = `You are a mistake analysis assistant. Help the student understand what went wrong.

Rules:
1. Analyze the mistake category and context.
2. Explain WHY the mistake happened.
3. Provide the correct approach.
4. Give a similar practice problem if appropriate.
5. Be constructive, never discouraging.
6. Keep responses focused and actionable.
7. NEVER reveal hidden test cases or reference solutions from the database.`;

function mistakeCategoryLabel(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function explainMistake(
  sessionId: string, userId: string,
  mistakeContext: { category: string; description?: string; problemTitle?: string; userAnswer?: string; expectedApproach?: string },
): Promise<SendMessageResult> {
  const admin = createAdminSupabaseClient();
  let userMessage = `I made a mistake categorized as "${mistakeCategoryLabel(mistakeContext.category)}".`;
  if (mistakeContext.problemTitle) userMessage += `\nProblem: ${mistakeContext.problemTitle}`;
  if (mistakeContext.description) userMessage += `\nDetails: ${mistakeContext.description}`;
  if (mistakeContext.userAnswer) userMessage += `\nMy answer/code:\n${mistakeContext.userAnswer.slice(0, 3000)}`;
  if (mistakeContext.expectedApproach) userMessage += `\nExpected approach: ${mistakeContext.expectedApproach}`;

  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'user', content: userMessage.slice(0, 4000) });
  const messages: ChatMessage[] = [
    { role: 'system', content: MISTAKE_EXPLAIN_SYSTEM },
    { role: 'user', content: userMessage },
  ];
  const reply = await callOpenRouter(messages);
  if (!reply) return { ok: false, sessionId, error: 'AI service unavailable.' };

  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'assistant', content: reply.slice(0, 8000) });
  await admin.from('ai_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  return { ok: true, sessionId, reply };
}

const RECOMMENDATION_SYSTEM = `You are a learning recommendation assistant. Turn skill-gap data into personalized, actionable advice.

Rules:
1. Use the provided skill-gap data as the source of truth.
2. Suggest 2-3 concrete actions the student can take.
3. Be encouraging and specific.
4. Reference the student's actual weak areas by name.
5. Keep responses concise (3-5 sentences).
6. Do not make up data not provided in the context.`;

export interface SkillGapRecommendation {
  skillId: string;
  skillName: string;
  gapScore: number;
  priority: string;
  reason: string;
}

export async function generateRecommendations(
  sessionId: string,
  userId: string,
  gaps: SkillGapRecommendation[],
): Promise<{ ok: boolean; sessionId: string; reply?: string; error?: string }> {
  const admin = createAdminSupabaseClient();

  if (gaps.length === 0) {
    return { ok: true, sessionId, reply: "Great news! You don't have any significant skill gaps right now. Keep up the consistent work and challenge yourself with harder problems." };
  }

  const gapSummary = gaps.slice(0, 5).map((g, i) => `${i + 1}. ${g.skillName} (gap: ${g.gapScore}%, priority: ${g.priority}) — ${g.reason}`).join('\n');
  const userMessage = `Based on my learning data, here are my current skill gaps:\n\n${gapSummary}\n\nCan you give me personalized recommendations on what to focus on next?`;

  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'user', content: userMessage.slice(0, 4000) });

  const messages: ChatMessage[] = [
    { role: 'system', content: RECOMMENDATION_SYSTEM },
    { role: 'user', content: userMessage },
  ];

  const reply = await callOpenRouter(messages);
  if (!reply) return { ok: false, sessionId, error: 'AI service unavailable.' };

  await admin.from('ai_messages').insert({ session_id: sessionId, role: 'assistant', content: reply.slice(0, 8000) });
  await admin.from('ai_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

  for (const gap of gaps.slice(0, 3)) {
    await admin.from('learning_recommendations').insert({
      user_id: userId, skill_id: gap.skillId, recommendation_type: 'ai_suggested',
      title: `Improve ${gap.skillName}`, reason: reply.slice(0, 500),
      priority: gap.gapScore, source: 'ai',
    });
  }

  return { ok: true, sessionId, reply };
}

export async function generateAdminContent(kind: string, title: string, instruction: string): Promise<unknown | null> {
  const baseFields = ['concept','explanation','mentalModel','realExample','codeExample','codeLanguage','output','commonMistakes','practiceTask','interviewQuestions','quickRevision','resources'];
  const prompts: Record<string,string> = {
    dsa: 'You create accurate educational DSA drafts. Return ONLY a JSON object with: title, summary, problem, examples, constraints, hint, bruteForce, optimized, timeComplexity, spaceComplexity, starterCode, solution, testCases. Use Java. testCases must be an array of objects with stdin and expected.',
    quiz: 'You create assessment drafts. Return ONLY a JSON object with a questions array. Each question has prompt, type, options, answer, explanation.',
    test: 'You create a complete assessment draft. Return ONLY a JSON object with title, description, durationMinutes, passingScore, unlockDays, requiredProgress, and a questions array. Each question has prompt, type, options, answer, explanation.',
    'topic-outline': 'You create a course outline. Return ONLY a JSON object with a topics array. Each topic has title, slug, summary, difficulty, estimatedMinutes.',
    roadmap: 'You design a structured learning roadmap for students. Return ONLY a JSON object with: title, slug, description, categoryNames, estimatedWeeks, milestones.',
    topic: `You create original, accurate study content. Return ONLY a JSON object with these fields: ${baseFields.join(', ')}. Use null for code fields when code is not appropriate. commonMistakes and interviewQuestions must be arrays. resources must be an array of useful official documentation URLs or source labels.`,
  };
  if (!prompts[kind]) return null;
  const text = await callOpenRouter([{ role: 'system', content: prompts[kind] }, { role: 'user', content: `Title: ${title.slice(0,200)}\nInstruction: ${instruction.slice(0,4000)}\nReturn only valid JSON.` }]);
  if (!text) return null;
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) { try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; } }
    return null;
  }
}
