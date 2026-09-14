'use client';

import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState } from 'react';

export function CertificateActions({ certificateCode }: { certificateCode: string }) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function downloadCertificate() {
    const sheet = document.querySelector<HTMLElement>('.certificate-sheet');
    if (!sheet || busy) {
      console.warn('Certificate element standard selector (.certificate-sheet) not found');
      return;
    }

    setBusy(true);
    setSuccess(false);

    try {
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const width = 297;
      const height = width * (canvas.height / canvas.width);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [width, height],
      });

      pdf.addImage(image, 'PNG', 0, 0, width, height, undefined, 'FAST');
      pdf.save(`certificate-${certificateCode}.pdf`);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={downloadCertificate}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-200 ${
        success
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-amber-500/30 bg-blue-950 text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-400 shadow-sm disabled:opacity-60'
      }`}
    >
      {busy ? (
        <>
          <Loader2 size={14} className="animate-spin text-amber-400 dark:text-slate-950" />
          <span>Generating PDF…</span>
        </>
      ) : success ? (
        <>
          <CheckCircle2 size={14} className="text-emerald-500" />
          <span>PDF Downloaded!</span>
        </>
      ) : (
        <>
          <Download size={14} />
          <span>Download PDF</span>
        </>
      )}
    </button>
  );
}