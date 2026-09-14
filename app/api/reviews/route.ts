import { jsonError, jsonOk } from '@/services/http';
import { requireUser } from '@/services/auth';
import { getDueReviews, gradeReview } from '@/services/reviews';

export async function GET() {
  const user = await requireUser();
  try { return jsonOk({ reviews: await getDueReviews(user.id) }); }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to load reviews', 500); }
}

export async function POST(request: Request) {
  const user = await requireUser();
  try {
    const body = await request.json();
    const grade = Number(body.grade);
    if (!body.reviewId || !Number.isInteger(grade) || grade < 0 || grade > 5) return jsonError('Invalid review payload');
    return jsonOk({ review: await gradeReview(user.id, String(body.reviewId), grade as 0|1|2|3|4|5) });
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to grade review', 400); }
}
