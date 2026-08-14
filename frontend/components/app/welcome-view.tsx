'use client';

import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Globe,
  HeartPulse,
  Lock,
  Mic,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { CursorLight } from '@/components/app/cursor-light';
import { Navbar } from '@/components/app/navbar';
import { Button } from '@/components/ui/button';

type WelcomeStatus = 'ready' | 'connecting' | 'ended' | 'microphone-error' | 'connection-error';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
  status: WelcomeStatus;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  status,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => (
  <div
    ref={ref}
    className="relative flex min-h-screen flex-col overflow-hidden bg-[#F6FBFA] font-sans text-[#123532] antialiased"
  >
    {/* Dynamic Cursor Reactive Background Lighting */}
    <CursorLight />

    {/* Floating Glass Navbar */}
    <Navbar />

    {/* Main Hero & Content Container */}
    <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-20 px-4 py-8 sm:px-6 lg:px-8">
      {/* Asymmetric Hero Section */}
      <section className="grid grid-cols-1 items-center gap-8 pt-4 sm:pt-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Column: Human Editorial Brand Copy */}
        <div className="space-y-6 text-left lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] px-3.5 py-1.5 text-xs font-semibold text-[#0F766E]">
            <Activity className="size-3.5 text-[#0F766E]" />
            <span>Voice-First AI Healthcare Companion</span>
          </div>

          <h1 className="font-serif text-4xl leading-[1.12] font-normal tracking-tight text-[#123532] sm:text-5xl lg:text-6xl">
            Healthcare <br />
            <span className="text-[#0F766E] italic">that listens.</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#526C68] sm:text-lg">
            MediSathi is a calm, voice-first healthcare companion designed to help you understand
            symptoms, find verified clinics, and connect with human care when needed.
          </p>

          {/* Regional Grounding & Language Snippet */}
          <div className="glass-light flex max-w-md items-center gap-3 rounded-2xl border border-[rgba(15,118,110,0.12)] p-4 shadow-xs">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-xs font-bold text-[#FFFFFF] shadow-xs">
              IN
            </div>
            <div>
              <p className="text-sm font-semibold text-[#D6A756]">आपकी सेहत, आपकी भाषा में।</p>
              <p className="text-xs text-[#78918D]">Talk naturally in English or Hindi.</p>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="grid max-w-lg grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#526C68]">
              <CheckCircle2 className="size-4 shrink-0 text-[#0F766E]" />
              <span>Consented Memory &amp; Privacy</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#526C68]">
              <CheckCircle2 className="size-4 shrink-0 text-[#0F766E]" />
              <span>Verified Facility Search</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#526C68]">
              <CheckCircle2 className="size-4 shrink-0 text-[#0F766E]" />
              <span>Structured Human Escalation</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-[#526C68]">
              <CheckCircle2 className="size-4 shrink-0 text-[#0F766E]" />
              <span>Real-Time Operational Analytics</span>
            </div>
          </div>
        </div>

        {/* Right Column: SIGNATURE FLOATING GLASS MICROPHONE POD (Visual Hero!) */}
        <div className="lg:col-span-5">
          <div className="glass-panel hover:shadow-3xl relative overflow-hidden rounded-3xl p-8 text-center shadow-2xl transition-all">
            {/* Concentric Medical Breathing Pulse Rings */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
              <div className="animate-pulse-ring size-72 rounded-full border border-[#0F766E]/30" />
              <div className="animate-pulse-ring size-48 rounded-full border border-[#5EEAD4]/50" />
            </div>

            {status === 'microphone-error' ? (
              <MicrophoneError onTryAgain={onStartCall} />
            ) : status === 'connection-error' ? (
              <ConnectionError onTryAgain={onStartCall} />
            ) : (
              <WelcomeAction
                status={status}
                startButtonText={startButtonText}
                onStartCall={onStartCall}
              />
            )}
          </div>
        </div>
      </section>

      {/* Editorial Feature Section: "One companion. Multiple ways to help." */}
      <section className="space-y-8 border-t border-[rgba(15,118,110,0.12)] pt-6">
        <div className="space-y-1 text-left">
          <span className="text-xs font-bold tracking-wider text-[#0F766E] uppercase">
            Capabilities
          </span>
          <h2 className="font-serif text-3xl text-[#123532] sm:text-4xl">
            One companion. Multiple ways to help.
          </h2>
          <p className="max-w-xl text-sm text-[#78918D]">
            Designed for safe health access with clinical guardrails and human escalation protocols.
          </p>
        </div>

        {/* Asymmetrical Editorial Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Card 1: Large Featured Card */}
          <article className="glass-card flex flex-col justify-between space-y-4 rounded-3xl p-7 text-left md:col-span-7">
            <div className="space-y-3">
              <div className="grid size-12 place-items-center rounded-2xl border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] text-[#0F766E] shadow-xs">
                <Stethoscope className="size-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#123532]">
                Symptom Care Triage
              </h3>
              <p className="text-sm leading-relaxed text-[#526C68]">
                Discuss symptoms naturally. MediSathi provides calm, structured triage guidance
                explaining whether care is routine, urgent, or emergency—without making an
                inappropriate diagnosis.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-[rgba(15,118,110,0.1)] pt-4 text-xs font-semibold text-[#0F766E]">
              <ShieldCheck className="size-4 text-[#0F766E]" />
              <span>Calm triage guardrails • No medical jargon</span>
            </div>
          </article>

          {/* Card 2: Secondary Card */}
          <article className="glass-card flex flex-col justify-between space-y-4 rounded-3xl p-7 text-left md:col-span-5">
            <div className="space-y-3">
              <div className="grid size-12 place-items-center rounded-2xl border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] text-[#0F766E] shadow-xs">
                <Building2 className="size-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#123532]">
                Verified Facility Search
              </h3>
              <p className="text-sm leading-relaxed text-[#526C68]">
                Locate nearby Primary Health Centers (PHCs), CHCs, clinics, and hospitals using our
                specialist facility assistant (male voice: Karan).
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-[rgba(15,118,110,0.1)] pt-4 text-xs font-semibold text-[#0F766E]">
              <Globe className="size-4 text-[#0F766E]" />
              <span>Real facility lookup tool</span>
            </div>
          </article>

          {/* Card 3: Supporting Card */}
          <article className="glass-card flex flex-col justify-between space-y-4 rounded-3xl p-7 text-left md:col-span-6">
            <div className="space-y-3">
              <div className="grid size-12 place-items-center rounded-2xl border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] text-[#0F766E] shadow-xs">
                <UserCheck className="size-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#123532]">Human Escalation</h3>
              <p className="text-sm leading-relaxed text-[#526C68]">
                When professional medical decision-making or diagnosis is requested, MediSathi
                creates a structured human help request with your explicit consent.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-[rgba(15,118,110,0.1)] pt-4 text-xs font-semibold text-[#0F766E]">
              <Lock className="size-4 text-[#0F766E]" />
              <span>Requires explicit caller consent</span>
            </div>
          </article>

          {/* Card 4: Supporting Card */}
          <article className="glass-card flex flex-col justify-between space-y-4 rounded-3xl p-7 text-left md:col-span-6">
            <div className="space-y-3">
              <div className="grid size-12 place-items-center rounded-2xl border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] text-[#0F766E] shadow-xs">
                <HeartPulse className="size-6" />
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#123532]">Consented Memory</h3>
              <p className="text-sm leading-relaxed text-[#526C68]">
                Remembers your name and ongoing conditions across voice sessions only after explicit
                permission, maintaining total data privacy.
              </p>
            </div>
            <div className="flex items-center gap-2 border-t border-[rgba(15,118,110,0.1)] pt-4 text-xs font-semibold text-[#0F766E]">
              <CheckCircle2 className="size-4 text-[#0F766E]" />
              <span>SQLite memory store</span>
            </div>
          </article>
        </div>
      </section>

      {/* Healthcare Trust & Disclaimer Section: "Built to help responsibly." */}
      <section className="glass-panel flex flex-col items-start justify-between gap-6 rounded-3xl p-6 text-left shadow-md sm:p-8 md:flex-row md:items-center">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#D6A756] uppercase">
            <AlertTriangle className="size-4 text-[#D6A756]" />
            <span>Built to Help Responsibly</span>
          </div>
          <h3 className="font-serif text-xl text-[#123532] sm:text-2xl">
            Healthcare information, not a replacement for doctors.
          </h3>
          <p className="text-xs leading-relaxed text-[#526C68]">
            MediSathi provides general health information and is not a substitute for licensed
            medical advice, diagnosis, or treatment. If you are experiencing severe symptoms or a
            medical emergency, please contact local emergency medical services immediately.
          </p>
        </div>
        <div className="shrink-0">
          <span className="inline-block rounded-xl border border-[rgba(15,118,110,0.16)] bg-[#E7F4F1] px-4 py-2 text-xs font-semibold text-[#0F766E]">
            Verified Safety Boundaries
          </span>
        </div>
      </section>
    </main>

    {/* Footer */}
    <footer className="relative z-10 border-t border-[rgba(15,118,110,0.12)] py-6 text-center text-xs text-[#78918D]">
      MediSathi Health Access Platform · Powered by Murf Falcon TTS &amp; LiveKit Agents
    </footer>
  </div>
);

function WelcomeAction({ status, startButtonText, onStartCall }: WelcomeViewProps) {
  const connecting = status === 'connecting';
  const ended = status === 'ended';

  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Signature Floating Glass Microphone Pod */}
      <button
        type="button"
        className="group relative mb-6 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F766E]"
        onClick={onStartCall}
        disabled={connecting}
        aria-label={ended ? 'Start a new MediSathi conversation' : 'Start a MediSathi conversation'}
      >
        <div className="grid size-28 place-items-center rounded-full border border-[rgba(15,118,110,0.2)] bg-gradient-to-b from-[#FFFFFF] to-[#E7F4F1] text-[#0F766E] shadow-xl transition duration-300 group-hover:scale-105 sm:size-32">
          {connecting ? (
            <span className="size-10 animate-spin rounded-full border-3 border-[#0F766E] border-t-transparent" />
          ) : ended ? (
            <RefreshCw className="size-10 text-[#78918D]" />
          ) : (
            <Mic className="size-10 animate-pulse text-[#0F766E]" />
          )}
        </div>
      </button>

      {/* Assistant Status Title & Copy */}
      <h2 className="font-serif text-2xl font-bold text-[#123532] sm:text-3xl">
        {connecting
          ? 'Connecting to MediSathi...'
          : ended
            ? 'Conversation Ended'
            : 'MediSathi is Ready'}
      </h2>

      <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#526C68]">
        {connecting
          ? 'Establishing secure healthcare voice channel...'
          : ended
            ? 'Thank you for talking with MediSathi.'
            : 'Tap the button below to start your natural voice conversation.'}
      </p>

      {/* Primary Action Button */}
      <Button
        size="lg"
        disabled={connecting}
        onClick={onStartCall}
        className="mt-6 h-13 w-full max-w-xs rounded-2xl bg-[#0F766E] text-base font-semibold text-[#FFFFFF] shadow-lg shadow-[#0F766E]/20 transition hover:bg-[#115E59] active:scale-[0.98]"
        aria-label={ended ? 'Start new conversation' : 'Start conversation with MediSathi'}
      >
        <Mic className="mr-2 size-5 text-[#5EEAD4]" />
        {ended ? 'Start New Session' : startButtonText}
      </Button>

      {/* Privacy Notice */}
      <span className="mt-4 flex items-center gap-1 text-[11px] text-[#78918D]">
        <Lock className="size-3 text-[#0F766E]" /> Private &amp; Confidential • Hands-free voice
      </span>
    </div>
  );
}

function MicrophoneError({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <div className="relative z-10 space-y-4 text-left">
      <div className="grid size-12 place-items-center rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="font-serif text-xl font-bold text-[#123532]">Microphone Access Required</h2>
      <p className="text-xs leading-relaxed text-[#526C68]">
        MediSathi needs microphone permission to conduct natural voice conversations.
      </p>
      <ol className="list-decimal space-y-1.5 pl-4 text-xs text-[#526C68]">
        <li>Click the camera icon in your browser address bar.</li>
        <li>Select &quot;Allow microphone access&quot;.</li>
        <li>Click Try Again below.</li>
      </ol>
      <Button
        onClick={onTryAgain}
        className="mt-4 w-full rounded-xl bg-[#0F766E] text-sm font-semibold text-[#FFFFFF] hover:bg-[#115E59]"
      >
        <RefreshCw className="mr-2 size-4" /> Try Again
      </Button>
    </div>
  );
}

function ConnectionError({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <div className="relative z-10 space-y-4 text-left">
      <div className="grid size-12 place-items-center rounded-2xl border border-[#DC2626]/30 bg-[#DC2626]/10 text-[#DC2626]">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="font-serif text-xl font-bold text-[#123532]">Connection Unavailable</h2>
      <p className="text-xs leading-relaxed text-[#526C68]">
        We couldn&apos;t connect to the MediSathi voice server. Please check your internet and try
        again.
      </p>
      <Button
        onClick={onTryAgain}
        className="mt-4 w-full rounded-xl bg-[#0F766E] text-sm font-semibold text-[#FFFFFF] hover:bg-[#115E59]"
      >
        <RefreshCw className="mr-2 size-4" /> Retry Connection
      </Button>
    </div>
  );
}
