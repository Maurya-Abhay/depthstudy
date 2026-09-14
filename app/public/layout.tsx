import { PublicShell } from '@/app/public/_components/public-shell';
import { getStudyLibrary } from '@/services/study';

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { categories, topics } = await getStudyLibrary();
  return (
    <PublicShell categories={categories} topics={topics}>
      {children}
    </PublicShell>
  );
}
