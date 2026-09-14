import Link from 'next/link';
import { ArrowLeft, FileX2 } from 'lucide-react';
import { UserShell } from '@/app/user/(protected)/_components/user-shell';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { CertificateActions } from '@/app/user/(protected)/_components/certificate-actions';
import { CertificateCanvasView } from '@/app/user/(protected)/_components/certificate-canvas-view';

type Certificate = {
  certificate_code: string;
  score: number;
  issued_at: string;
  revoked_at: string | null;
  profiles: { name: string | null } | null;
  courses: { title: string | null } | null;
};

export default async function PrivateCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from('certificates')
    .select('certificate_code,score,issued_at,revoked_at,user_id,course_id')
    .eq('certificate_code', id)
    .eq('user_id', user.id)
    .maybeSingle();

  let certificate: Certificate | null = null;
  if (row) {
    const [{ data: profile }, { data: course }] = await Promise.all([
      supabase
        .from('profiles')
        .select('name')
        .eq('id', row.user_id)
        .maybeSingle(),
      supabase
        .from('courses')
        .select('title')
        .eq('id', row.course_id)
        .maybeSingle(),
    ]);
    certificate = {
      ...row,
      profiles: profile,
      courses: course,
    } as unknown as Certificate;
  }

  const valid = Boolean(certificate && !certificate.revoked_at);
  const profile = certificate?.profiles;
  const course = certificate?.courses;
  const date = certificate
    ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <UserShell>
      <div className="space-y-6">
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <Link
            href="/dashboard/certificates"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={14} /> Back to certificates
          </Link>

          {valid && certificate ? (
            <CertificateActions certificateCode={certificate.certificate_code} />
          ) : null}
        </div>

        {!valid || !certificate ? (
          /* Invalid State */
          <section className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 p-12 text-center shadow-lg">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <FileX2 size={28} />
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Certificate Not Found
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              This certificate is either revoked or not available under your current logged-in account.
            </p>
          </section>
        ) : (
          /* Certificate View */
          <CertificateCanvasView
            name={profile?.name || 'Valued Learner'}
            courseTitle={course?.title || 'Professional Course Completion'}
            issuedDate={date || ''}
            certificateCode={certificate.certificate_code}
            score={certificate.score}
          />
        )}
      </div>
    </UserShell>
  );
}