import { requireLearner } from '@/services/auth';
import ResultClient from '@/app/user/(protected)/_components/result-client';

export default async function ResultPage() {
  await requireLearner();
  return <ResultClient />;
}
