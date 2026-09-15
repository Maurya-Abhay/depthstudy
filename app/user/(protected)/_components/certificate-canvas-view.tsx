'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

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
      {/* Premium Navy & Gold Certificate — outer frame */}
      <div className="w-full max-w-4xl rounded-xl bg-gradient-to-br from-[#0b2447] via-[#16386b] to-[#0b2447] p-2.5 shadow-2xl ring-1 ring-[#c9a227]/50">
        <article className="certificate-sheet relative w-full overflow-hidden rounded-lg bg-white text-center">
          {/* ── Header Band ── */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-r from-[#0b2447] via-[#143a70] to-[#0b2447] overflow-hidden">
            {/* Gold sweeping arcs */}
            <svg
              className="absolute inset-x-0 bottom-0 w-full"
              viewBox="0 0 800 96"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="certGold" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8a6a1c" />
                  <stop offset="35%" stopColor="#f5d778" />
                  <stop offset="55%" stopColor="#c9a227" />
                  <stop offset="80%" stopColor="#f8e08e" />
                  <stop offset="100%" stopColor="#8a6a1c" />
                </linearGradient>
              </defs>
              <path d="M0,96 C240,18 560,18 800,96 L800,96 L0,96 Z" fill="url(#certGold)" opacity="0.92" />
              <path d="M0,96 C260,34 540,34 800,96 Z" fill="none" stroke="url(#certGold)" strokeWidth="3" />
              <path d="M0,96 C300,52 500,52 800,96 Z" fill="none" stroke="#f5d778" strokeWidth="1.2" opacity="0.6" />
            </svg>

            {/* Brand — top left */}
            <div className="absolute top-4 left-5 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#f5d778] to-[#c9a227] text-[10px] font-black text-[#0b2447] shadow-md">
                DS
              </span>
              <span className="text-[11px] font-black tracking-[0.25em] text-white uppercase">
                Depth <span className="text-[#f0c75e]">Study</span>
              </span>
            </div>

            {/* Title */}
            <h1 className="absolute inset-x-0 top-5 text-2xl sm:text-4xl font-black tracking-[0.16em] text-white uppercase drop-shadow-md">
              Certificate
            </h1>

            {/* "Of Achievement" pill over the gold arcs */}
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
              <span className="rounded-full border-2 border-[#c9a227] bg-[#0b2447] px-6 py-1 text-[10px] sm:text-xs font-bold tracking-[0.35em] text-[#f0c75e] uppercase shadow-xl">
                Of Achievement
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="relative px-6 py-7 sm:px-12">
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] text-slate-500 uppercase">
              This certificate is proudly presented to
            </p>

            {/* Recipient name — from database */}
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-extrabold tracking-wide text-[#0b2447] uppercase break-words">
              {name}
            </h2>

            <div className="mx-auto mt-4 h-[3px] w-44 bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />

            {/* Course title on gold ribbon — from database */}
            <div className="mx-auto mt-5 w-fit max-w-full bg-gradient-to-r from-[#8a6a1c] via-[#c9a227] to-[#8a6a1c] px-6 py-1.5 shadow-md">
              <span className="text-sm sm:text-base font-bold uppercase tracking-[0.15em] text-white">
                {courseTitle}
              </span>
            </div>

            {/* Details line — score, date & ID from database */}
            <p className="mx-auto mt-4 max-w-xl text-[11px] sm:text-xs leading-relaxed text-slate-600">
              has successfully completed all course requirements with a final
              evaluation score of <strong className="text-[#0b2447]">{score}%</strong>.
              Issued on <strong className="text-[#0b2447]">{issuedDate}</strong> ·
              Certificate ID <strong className="font-mono text-[#0b2447]">{certificateCode}</strong>
            </p>

            {/* ── Footer: Signature, Seal, Date ── */}
            <div className="mt-8 flex items-end justify-between gap-3">
              {/* Signature */}
              <div className="min-w-[120px] flex-1 text-center">
                <span
                  className="block font-serif text-2xl text-[#0b2447]"
                  style={{ fontFamily: "'Segoe Script', 'Brush Script MT', cursive" }}
                >
                  Abhay
                </span>
                <span className="mx-auto mt-1 block h-[2px] w-full max-w-[160px] bg-[#c9a227]" />
                <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Signature
                </span>
              </div>

              {/* Verified seal */}
              <div className="flex shrink-0 justify-center pb-1">
                <span className="flex h-16 w-16 rotate-6 items-center justify-center rounded-full border-2 border-[#c9a227] bg-gradient-to-b from-[#f8e08e] to-[#c9a227] text-[#0b2447] shadow-xl">
                  <CheckCircle2 size={30} strokeWidth={2.4} />
                </span>
              </div>

              {/* Date */}
              <div className="min-w-[120px] flex-1 text-center">
                <span className="block font-serif text-base font-semibold text-[#0b2447]">
                  {issuedDate}
                </span>
                <span className="mx-auto mt-1 block h-[2px] w-full max-w-[160px] bg-[#c9a227]" />
                <span className="mt-1.5 block text-[9px] font-bold uppercase tracking-[0.25em] text-slate-500">
                  Date
                </span>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Sub-Text Below Certificate */}
      <p className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pt-1">
        <ShieldCheck size={14} className="text-amber-500" /> Verified certificate • ID: {certificateCode}
      </p>
    </div>
  );
}