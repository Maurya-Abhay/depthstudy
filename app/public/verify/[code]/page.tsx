import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, XCircle, Award, BrainCircuit } from 'lucide-react';
import { verifyByCode } from '@/services/proof';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Verify ${code} — Depth Study`,
    description: 'Verify the authenticity of a Depth Study certificate or assessment.',
  };
}

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }: Props) {
  const { code } = await params;
  const result = await verifyByCode(code);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101d] text-slate-900 dark:text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <ShieldCheck size={32} className="mx-auto mb-3 text-indigo-500" />
          <h1 className="text-2xl font-black tracking-tight">Credential Verification</h1>
          <p className="mt-1 text-sm text-slate-500 font-mono">{code}</p>
        </div>

        {result ? (
          <div className={`rounded-2xl border p-6 ${result.revoked ? 'border-rose-500/30 bg-rose-50 dark:bg-rose-500/5' : 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5'}`}>
            <div className="flex items-center gap-3 mb-4">
              {result.revoked ? (
                <XCircle size={24} className="text-rose-500" />
              ) : (
                <CheckCircle2 size={24} className="text-emerald-500" />
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {result.revoked ? 'Revoked' : 'Verified'}
                </h2>
                <p className="text-xs text-slate-500">
                  {result.type === 'certificate' ? 'Course Certificate' : 'Skill Assessment'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <div className="flex items-center gap-2">
                  {result.type === 'certificate' ? <Award size={16} className="text-purple-500" /> : <BrainCircuit size={16} className="text-indigo-500" />}
                  <span className="text-sm text-slate-600 dark:text-slate-400">Learner</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{result.learnerName}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">{result.type === 'certificate' ? 'Course' : 'Skill'}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{result.title}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Score</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{result.score}%</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Issued</span>
                <span className="text-sm text-slate-900 dark:text-white">{new Date(result.verifiedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {result.revoked && (
              <div className="mt-4 rounded-xl bg-rose-100 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-3">
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  This credential has been revoked and is no longer valid.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
            <XCircle size={32} className="mx-auto mb-3 text-slate-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Not Found</h2>
            <p className="mt-2 text-sm text-slate-500">
              No credential found with this verification code. It may be invalid or expired.
            </p>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-xs text-slate-500">
            Powered by <span className="font-semibold text-slate-700 dark:text-slate-300">Depth Study</span>
          </p>
          <Link href="/" className="mt-2 inline-block text-indigo-600 dark:text-indigo-400 font-medium text-xs hover:underline">
            depth-study.app
          </Link>
        </div>
      </div>
    </div>
  );
}
