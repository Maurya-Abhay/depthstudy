import { redirect } from 'next/navigation';
import { requireLearner } from '@/services/auth';
import { getOnboardingStatus } from '@/services/onboarding';

export default async function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireLearner();

  // Check onboarding status - redirect to onboarding if not complete
  const onboarding = await getOnboardingStatus(user.id);
  if (!onboarding.isCompleted) {
    redirect('/user/onboarding');
  }

  return children;
}
