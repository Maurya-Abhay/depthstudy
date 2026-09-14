import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Award, BrainCircuit, CheckCircle2, FileText } from 'lucide-react';
import { getPublicProofProfile } from '@/services/proof';
import type { PublicProofProfile } from '@/types/proof';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProofProfile(slug);
  if (!profile) {
    return { title: 'Profile Not Found', description: 'This skill profile is not available.' };
  }
  return {
    title: `${profile.displayName} — Proof of Skill`,
    description: profile.headline || `Verified skill profile for ${profile.displayName}.`,
    robots: 'index, follow',
  };
}

export const dynamic = 'force-dynamic';

export default async function PublicProofPage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProofProfile(slug);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b101d]">
        <div className="text-center p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 max-w-md">
          <FileText size={32} className="mx-auto mb-3 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profile Not Found</h1>
          <p className="mt-2 text-sm text-slate-500">This skill profile does not exist or is not public.</p>
          <Link href="/" className="mt-5 inline-block text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b101d] text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            <ShieldCheck size={13} />
            Proof of Skill
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{profile.displayName}</h1>
          {profile.headline && (
            <p className="mt-2 text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">{profile.headline}</p>
          )}
        </div>

        {profile.skills.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit size={18} className="text-indigo-500" />
              <h2 className="text-lg font-bold">Skills</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.skills.map((skill) => (
                <div key={skill.slug} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{skill.name}</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{skill.masteryScore}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${skill.masteryScore >= 70 ? 'bg-emerald-500' : skill.masteryScore >= 40 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{ width: `${skill.masteryScore}%` }} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span>Confidence: {skill.confidenceScore}%</span>
                    <span>Evidence: {skill.evidenceCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.verifiedAssessments.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h2 className="text-lg font-bold">Verified Assessments</h2>
            </div>
            <div className="space-y-2">
              {profile.verifiedAssessments.map((va) => (
                <div key={va.verificationCode} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{va.skillName}</span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{va.verificationCode}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{va.score}%</span>
                    <p className="text-[11px] text-slate-500">{new Date(va.verifiedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.certificates.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} className="text-purple-500" />
              <h2 className="text-lg font-bold">Certificates</h2>
            </div>
            <div className="space-y-2">
              {profile.certificates.map((cert) => (
                <div key={cert.certificateCode} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{cert.courseTitle}</span>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{cert.certificateCode}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{cert.score}%</span>
                    <p className="text-[11px] text-slate-500">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Verified by <span className="font-semibold text-slate-700 dark:text-slate-300">Depth Study</span>
          </p>
          <Link href="/" className="mt-2 inline-block text-indigo-600 dark:text-indigo-400 font-medium text-xs hover:underline">
            depth-study.app
          </Link>
        </div>
      </div>
    </div>
  );
}

