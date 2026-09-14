import Link from 'next/link';
import {
  ArrowLeft,
  Award,
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
            {/* Visual Professional Certificate Canvas Card */}
            <div className="relative bg-white text-zinc-900 rounded-2xl p-8 sm:p-12 shadow-2xl border-4 border-amber-500/30 overflow-hidden">
              {/* Decorative Geometric Corners (Inspired by Template) */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0a192f] [clip-path:polygon(100%_0,0_0,100%_100%)]" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/80 [clip-path:polygon(100%_0,0_0,100%_100%)] translate-x-2 -translate-y-2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0a192f] [clip-path:polygon(0_100%,0_0,100%_100%)]" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/80 [clip-path:polygon(0_100%,0_0,100%_100%)] -translate-x-2 translate-y-2" />

              {/* Watermark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <Award className="w-96 h-96 text-zinc-900" />
              </div>

              {/* Certificate Inner Content */}
              <div className="relative z-10 text-center space-y-6 my-4">
                {/* Header Brand */}
                <div className="flex items-center justify-center gap-2 text-indigo-900 font-extrabold text-sm tracking-wider uppercase">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
                    GQ
                  </div>
                  <span>GLOBAL QUEST ACADEMY</span>
                </div>

                {/* Certificate Title */}
                <div className="space-y-1 pt-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-amber-600 tracking-widest uppercase">
                    Certificate
                  </h1>
                  <p className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">
                    — OF COMPLETION —
                  </p>
                </div>

                <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase pt-2">
                  THIS CERTIFICATE IS PROUDLY PRESENTED TO
                </p>

                {/* Candidate Name */}
                <div className="inline-block border-b-2 border-amber-500/60 pb-1 px-8 min-w-[280px]">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0a192f]">
                    {profile?.name || 'Learner Name'}
                  </h2>
                </div>

                {/* Course Completion Details */}
                <p className="text-xs text-zinc-600 max-w-lg mx-auto leading-relaxed pt-2">
                  has successfully completed the course in{' '}
                  <strong className="text-zinc-900 font-bold">
                    {course?.title || 'Course Title Unavailable'}
                  </strong>{' '}
                  with an evaluation score of{' '}
                  <strong className="text-amber-600">{certificate.score}%</strong>.
                  We acknowledge the dedication, learning spirit, and contribution made by the candidate.
                </p>

                {/* Certificate Footer Meta Grid */}
                <div className="grid grid-cols-3 items-end pt-10 gap-4 max-w-2xl mx-auto text-left">
                  {/* Issue Date */}
                  <div className="border-t border-zinc-300 pt-2 text-center">
                    <div className="text-xs font-bold text-zinc-800">{formattedDate}</div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Date
                    </div>
                  </div>

                  {/* Certificate Number */}
                  <div className="border-t border-zinc-300 pt-2 text-center">
                    <div className="text-xs font-mono font-bold text-zinc-800">
                      {certificate.certificate_code}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Certificate No.
                    </div>
                  </div>

                  {/* Authority Signature */}
                  <div className="border-t border-zinc-300 pt-2 text-center">
                    <div className="font-serif italic text-sm font-bold text-indigo-950">
                      G.R. Narendra
                    </div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Authorized Signatory
                    </div>
                  </div>
                </div>
              </div>
            </div>

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