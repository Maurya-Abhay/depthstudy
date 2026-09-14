import { UserShell } from '@/app/user/(protected)/_components/user-shell';

export default async function DsaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <UserShell>{children}</UserShell>;
}
