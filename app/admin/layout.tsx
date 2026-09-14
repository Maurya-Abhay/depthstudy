import { requireAdmin } from '@/services/auth';

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return children;
}
