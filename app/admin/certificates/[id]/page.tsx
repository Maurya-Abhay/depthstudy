import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  User,
  BookOpen,
  Hash,
  Share2,
} from 'lucide-react';
import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { AdminShell } from '@/app/admin/_components/admin-shell';
import { CertificateCanvasView } from '@/app/user/(protected)/_components/certificate-canvas-view';

type Certificate = {
  certificate_code: string;
  score: number;
  issued_at: string;
  revoked_at: string | null;
  user_id: string;
  course_id: string;
};

export default async function AdminCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const { data: certificate } = (await admin
    .from('certificates')
    .select('certificate_code,score,issued_at,revoked_at,user_id,course_id')
    .eq('certificate_code', id)
    .maybeSingle()) as { data: Certificate | null };

  const [{ data: profile }, { data: course }] = certificate
    ? await Promise.all([
        admin
          .from('profiles')
          .select('name')
          .eq('id', certificate.user_id)
          .maybeSingle(),
        admin
          .from('courses')
          .select('title')
          .eq('id', certificate.course_id)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];

  const formattedDate = certificate
    ? new Date(certificate.issued_at).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto space-y-6 font-sans text-xs pb-12">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/certificates"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d111c] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/5 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to certificates
          </Link>
          {certificate && (
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                certificate.revoked_at
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
              }`}
            >
              {certificate.revoked_at ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" /> Status: Revoked
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> Status: Valid & Verified
                </>
              )}
            </span>
          )}
        </div>

        {certificate ? (
          <div className="space-y-6">
            {/* Premium Navy & Gold Certificate — shared design, DB-backed details */}
            <CertificateCanvasView
              name={profile?.name || 'Valued Learner'}
              courseTitle={course?.title || 'Professional Course Completion'}
              issuedDate={formattedDate}
              certificateCode={certificate.certificate_code}
              score={certificate.score}
            />

            {/* Admin Metadata Control Table */}
            <div className="bg-white dark:bg-[#0d111c] p-5 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Administrative Record Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Learner Name</span>
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-white truncate">
                    {profile?.name || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Associated Course</span>
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-white truncate">
                    {course?.title || 'N/A'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Passing Score</span>
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-white">
                    {certificate.score}%
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131823] border border-zinc-200/80 dark:border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>Issued Date</span>
                  </div>
                  <div className="font-bold text-zinc-900 dark:text-white">
                    {formattedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Certificate Not Found State */
          <div className="bg-white dark:bg-[#0d111c] p-12 rounded-xl border border-zinc-200 dark:border-white/5 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Hash className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Certificate Not Found
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-sm mx-auto">
              No certificate matches the specified code ID ({id}). Please check the code and try again.
            </p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}