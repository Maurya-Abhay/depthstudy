import { jsonError, jsonOk } from '@/services/http';
import { requireUser } from '@/services/auth';
import { finishInterview, getInterviewTracks, getNextInterviewQuestion, startInterview, submitInterviewAnswer, calculatePlacementReadiness } from '@/services/interview';

export async function GET(request: Request) {
  const user = await requireUser();
  try {
    const params = new URL(request.url).searchParams;
    if (params.get('sessionId')) return jsonOk({ question: await getNextInterviewQuestion(user.id, String(params.get('sessionId'))) });
    return jsonOk({ tracks: await getInterviewTracks() });
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to load interview', 500); }
}

export async function POST(request: Request) {
  const user = await requireUser();
  try {
    const body = await request.json();
    if (body.action === 'start') return jsonOk({ session: await startInterview(user.id, body.trackId ? String(body.trackId) : null, body.mode === 'mock' ? 'mock' : 'practice') }, { status: 201 });
    if (body.action === 'answer') return jsonOk({ answer: await submitInterviewAnswer(user.id, { sessionId: String(body.sessionId), questionId: String(body.questionId), answer: String(body.answer ?? '') }) });
    if (body.action === 'finish') return jsonOk({ session: await finishInterview(user.id, String(body.sessionId)) });
    if (body.action === 'readiness') return jsonOk({ readiness: await calculatePlacementReadiness(user.id) });
    return jsonError('Unknown interview action');
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Interview action failed', 400); }
}
