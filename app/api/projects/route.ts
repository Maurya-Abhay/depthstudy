import { jsonError, jsonOk } from '@/services/http';
import { requireUser } from '@/services/auth';
import { enrollProject, getPublishedProjects, getProjectWorkspace, getUserProjects, submitProject, updateMilestone } from '@/services/projects';

export async function GET(request: Request) {
  const user = await requireUser();
  try {
    const sessionId = new URL(request.url).searchParams.get('enrollmentId');
    if (sessionId) return jsonOk({ workspace: await getProjectWorkspace(user.id, sessionId) });
    return jsonOk({ projects: await getPublishedProjects(), mine: await getUserProjects(user.id) });
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to load projects', 500); }
}

export async function POST(request: Request) {
  const user = await requireUser();
  try {
    const body = await request.json();
    if (body.action === 'enroll') {
      if (!body.projectId) return jsonError('projectId is required');
      return jsonOk({ enrollment: await enrollProject(user.id, String(body.projectId)) }, { status: 201 });
    }
    if (body.action === 'milestone') {
      const status = ['pending','active','completed'].includes(String(body.status)) ? String(body.status) as 'pending'|'active'|'completed' : 'pending';
      return jsonOk({ result: await updateMilestone(user.id, String(body.enrollmentId), String(body.milestoneId), status) });
    }
    if (body.action === 'submit') {
      if (!body.enrollmentId || !body.projectId) return jsonError('enrollmentId and projectId are required');
      return jsonOk({ submission: await submitProject(user.id, { enrollmentId: String(body.enrollmentId), projectId: String(body.projectId), repoUrl: body.repoUrl, demoUrl: body.demoUrl, notes: body.notes }) }, { status: 201 });
    }
    return jsonError('Unknown project action');
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Project action failed', 400); }
}
