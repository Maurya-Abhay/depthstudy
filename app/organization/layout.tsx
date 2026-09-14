import { requireUser } from '@/services/auth';

export default async function OrganizationLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return children;
}
