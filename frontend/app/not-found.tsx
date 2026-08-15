import Link from 'next/link';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { MediSathiLogo } from '@/components/app/medisathi-logo';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F7FAF9] px-4 font-sans text-[#16302D]">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-[#D6E5E1] bg-[#FFFFFF] p-8 text-center shadow-xl">
        <div className="mx-auto flex justify-center">
          <MediSathiLogo size={44} variant="light" />
        </div>

        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#EEF5F3] text-[#0F766E]">
          <Stethoscope className="size-7" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-extrabold text-[#134E4A]">404</h1>
          <h2 className="font-heading text-lg font-bold text-[#16302D]">Page Not Found</h2>
          <p className="text-xs leading-relaxed text-[#526B67]">
            The requested page does not exist or has been moved. You can return to the MEDISATHI
            healthcare assistant home page.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-6 text-xs font-bold text-white shadow-md transition hover:bg-[#115E59]"
          >
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
