'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Phone, X } from 'lucide-react';

const emergencyPhoneNumber = process.env.NEXT_PUBLIC_EMERGENCY_PHONE_NUMBER ?? '112';

export function SosButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAttemptedCall, setHasAttemptedCall] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const callEmergencyServices = () => {
    setHasAttemptedCall(true);
    window.location.href = `tel:${emergencyPhoneNumber}`;
  };

  const close = () => {
    setHasAttemptedCall(false);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#DC2626] px-4.5 text-sm font-bold text-white shadow-xl shadow-[#DC2626]/30 transition hover:-translate-y-0.5 hover:bg-[#B91C1C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DC2626] sm:right-6"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        aria-label="Emergency assistance: call emergency services"
      >
        <AlertTriangle className="size-4" aria-hidden="true" />
        SOS
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-dialog-title"
            aria-describedby="emergency-dialog-description"
            className="glass-panel-light relative w-full max-w-md rounded-3xl border border-[#D6E5E1] bg-[#FFFFFF] p-6 text-left shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#DC2626]/10 text-[#DC2626]">
                <AlertTriangle className="size-6" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={close}
                className="grid size-10 place-items-center rounded-xl text-[#526B67] transition hover:bg-[#EEF5F3] hover:text-[#16302D] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
                aria-label="Close emergency assistance dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <h2 id="emergency-dialog-title" className="mt-5 font-serif text-2xl text-[#16302D]">
              Emergency assistance
            </h2>
            <p
              id="emergency-dialog-description"
              className="mt-2 text-sm leading-relaxed text-[#526B67]"
            >
              If you are experiencing a life-threatening emergency, contact emergency services
              immediately. If your device does not open a call screen, dial {emergencyPhoneNumber}{' '}
              directly.
            </p>

            {hasAttemptedCall && (
              <p
                className="mt-4 rounded-xl border border-[#D6E5E1] bg-[#EEF5F3] p-3 text-xs leading-5 text-[#526B67]"
                role="status"
              >
                We&apos;ve opened your device&apos;s calling interface for {emergencyPhoneNumber}.
                If it doesn&apos;t open, please call {emergencyPhoneNumber} directly.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="min-h-11 rounded-xl px-4 text-sm font-semibold text-[#526B67] transition hover:bg-[#EEF5F3] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={callEmergencyServices}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-5 text-sm font-semibold text-white transition hover:bg-[#B91C1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DC2626]"
              >
                <Phone className="size-4" aria-hidden="true" />
                Call emergency services
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
