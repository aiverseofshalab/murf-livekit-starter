'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { MediSathiLogo } from '@/components/app/medisathi-logo';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled MEDISATHI application error:', error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F7FAF9] px-4 font-sans text-[#16302D]">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#D6E5E1] bg-[#FFFFFF] p-8 text-center shadow-xl">
        <div className="mx-auto flex justify-center">
          <MediSathiLogo size={44} variant="light" />
        </div>

        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#DC2626]/10 text-[#DC2626]">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold text-[#134E4A]">Something went wrong</h1>
          <p className="text-xs leading-relaxed text-[#526B67]">
            MEDISATHI encountered an unexpected issue while loading this page. Our team has been
            notified.
          </p>
        </div>

        {error.digest && (
          <p className="rounded-lg border border-[#D6E5E1] bg-[#EEF5F3] p-2 font-mono text-[11px] text-[#829A96]">
            Error Ref: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-5 text-xs font-bold text-white shadow-md transition hover:bg-[#115E59]"
          >
            <RefreshCw className="size-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] px-5 text-xs font-bold text-[#0F766E] transition hover:bg-[#FFFFFF]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
