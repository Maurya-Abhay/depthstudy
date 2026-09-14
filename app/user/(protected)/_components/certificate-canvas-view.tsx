'use client';

import React from 'react';
import { ShieldCheck, Award, CheckCircle2 } from 'lucide-react';

interface CertificateProps {
  name: string;
  courseTitle: string;
  issuedDate: string;
  certificateCode: string;
  score: number;
}

export function CertificateCanvasView({
  name,
  courseTitle,
  issuedDate,
  certificateCode,
  score,
}: CertificateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 w-full">
      {/* 1:1 Image Pixel-Perfect Dark Luxury Certificate Container */}
      <div className="w-full max-w-4xl p-1 rounded-2xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 shadow-2xl">
        <article className="certificate-sheet relative w-full overflow-hidden rounded-[14px] bg-[#0A0D14] p-8 sm:p-12 text-center text-slate-100">
          
          {/* Subtle Glow Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-amber-950/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Top Bar: Brand & Badge */}
            <div className="flex w-full items-center justify-between pb-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-black text-white shadow-sm">
                  DS
                </span>
                <span className="text-xs font-black tracking-widest text-white uppercase">
                  DEPTH <span className="text-amber-400">STUDY</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                <Award size={13} className="text-amber-400" /> OFFICIAL CERTIFICATE
              </div>
            </div>

            {/* Certificate Header */}
            <div className="mt-4 space-y-1">
              <p className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                CERTIFICATE OF ACHIEVEMENT
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-wider text-white uppercase">
                CERTIFICATE
              </h1>
              <div className="mx-auto my-2 h-[2px] w-12 bg-amber-500" />
              <p className="pt-1 text-xs text-slate-400 font-medium">
                This certificate is proudly awarded to
              </p>
            </div>

            {/* Candidate Name */}
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-wide">
              {name}
            </h2>

            <p className="mt-5 text-xs text-slate-400 font-medium">
              for successfully completing the course requirements for
            </p>

            {/* Course Title */}
            <h3 className="mt-1 text-xl sm:text-2xl font-bold text-white">
              {courseTitle}
            </h3>

            {/* Details Box */}
            <div className="mt-8 grid w-full grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl border border-slate-800/80 bg-[#06080E]/80 p-3.5 text-left">
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  ISSUED DATE
                </span>
                <strong className="block text-xs font-semibold text-slate-200 mt-0.5">
                  {issuedDate}
                </strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  COMPLETION DATE
                </span>
                <strong className="block text-xs font-semibold text-slate-200 mt-0.5">
                  {issuedDate}
                </strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  CERTIFICATE ID
                </span>
                <strong className="block text-xs font-semibold text-slate-200 mt-0.5 truncate">
                  {certificateCode}
                </strong>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  FINAL SCORE
                </span>
                <strong className="block text-xs font-bold text-emerald-400 mt-0.5">
                  {score}%
                </strong>
              </div>
            </div>

            {/* Bottom Signatures & Badge */}
            <div className="mt-10 flex w-full items-end justify-between pt-2">
              <div className="text-left">
                <div className="font-serif italic text-base text-slate-200">
                  Depth Study
                </div>
                <span className="block text-[10px] text-slate-500 font-medium">
                  Learning Platform
                </span>
              </div>

              {/* Verified Pill */}
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div className="text-left leading-tight">
                  <span className="block text-[10px] font-bold text-emerald-400">
                    Verified Credential
                  </span>
                  <span className="block text-[8px] text-emerald-500/80">
                    Private Learner Certificate
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="font-serif italic text-base text-slate-200">
                  Depth Study
                </div>
                <span className="block text-[10px] text-slate-500 font-medium">
                  Authorized Signature
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Sub-Text Below Certificate */}
      <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
        <ShieldCheck size={14} className="text-amber-500" /> Private certificate • ID: {certificateCode}
      </p>
    </div>
  );
}