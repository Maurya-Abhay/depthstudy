import { requireLearner } from '@/services/auth';
import TestClient from '@/app/user/(protected)/_components/test-client';

export default async function TestPage() {
  await requireLearner();
  return <TestClient />;
}
