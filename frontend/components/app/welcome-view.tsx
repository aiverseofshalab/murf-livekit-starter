'use client';

import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  HeartPulse,
  Lock,
  Mic,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  Volume2,
} from 'lucide-react';
import { CursorLight } from '@/components/app/cursor-light';
import { MediSathiLogo } from '@/components/app/medisathi-logo';
import { Navbar } from '@/components/app/navbar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';

type WelcomeStatus = 'ready' | 'connecting' | 'ended' | 'microphone-error' | 'connection-error';
type ShowcaseState =
  | 'ready'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'ended'
  | 'error';

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
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [demoState, setDemoState] = useState<ShowcaseState>('listening');
  const isHindi = language === 'hi';

  return (
    <div
      ref={ref}
      className={`relative flex min-h-screen flex-col overflow-x-hidden bg-[#F7FAF9] text-[#16302D] antialiased ${
        isHindi ? 'font-hindi' : 'font-sans'
      }`}
    >
      {/* Dynamic Cursor Reactive Background Lighting */}
      <CursorLight />

      {/* Sticky Dark Glass Navbar */}
      <Navbar />

      {/* ============================================================ */}
      {/* SECTION 1: HERO — DARK PREMIUM HEALTH-TECH SECTION (#071B19) */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden border-b border-[#2A4E49] bg-[#071B19] px-4 py-12 text-[#F5FAF9] sm:px-6 sm:py-20 lg:px-8">
        {/* Soft Radial Teal Background Depth */}
        <div className="pointer-events-none absolute -top-32 left-1/2 size-[750px] -translate-x-1/2 rounded-full bg-[#0F766E]/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-10 size-96 rounded-full bg-[#5EEAD4]/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Headline, Description & CTAs */}
            <div className="space-y-6 text-left lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#2A4E49] bg-[#102F2B] px-3.5 py-1.5 text-xs font-semibold text-[#5EEAD4]">
                <Activity className="size-3.5 text-[#5EEAD4]" />
                <span>{t.hero.badge}</span>
              </div>

              <h1 className="font-heading text-4xl leading-[1.12] font-extrabold tracking-tight text-[#F5FAF9] sm:text-5xl lg:text-6xl">
                {t.hero.headline}
                <br />
                <span className="text-[#5EEAD4]">{t.hero.headlineAccent}</span>
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[#B8CBC8] sm:text-lg">
                {t.hero.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={onStartCall}
                  className="h-13 rounded-2xl bg-[#0F766E] px-6 text-base font-bold tracking-wider text-[#FFFFFF] shadow-xl shadow-[#0F766E]/30 transition hover:bg-[#115E59] active:scale-[0.98]"
                >
                  <Mic className="mr-2 size-5 text-[#5EEAD4]" />
                  {t.hero.talkButton}
                </Button>
                <a
                  href="#how-it-works"
                  className="inline-flex h-13 items-center justify-center rounded-2xl border border-[#2A4E49] bg-[#102F2B] px-6 text-sm font-semibold text-[#B8CBC8] transition hover:bg-[#163A35] hover:text-[#F5FAF9]"
                >
                  {t.hero.howItWorksButton}
                </a>
              </div>

              {/* Regional Language Switcher Box */}
              <div className="glass-panel-dark flex max-w-md items-center gap-3.5 rounded-2xl border border-[#2A4E49] bg-[#102F2B]/90 p-4 shadow-md">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-xs font-extrabold text-[#FFFFFF]">
                  IN
                </div>
                <div className="flex-1">
                  <p className="font-hindi text-sm font-semibold text-[#D6A756]">
                    {t.hero.regionalNoteTitle}
                  </p>
                  <p className="text-xs text-[#B8CBC8]">{t.hero.regionalNoteDesc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  className="rounded-xl border border-[#2A4E49] bg-[#163A35] px-3 py-1.5 text-xs font-bold text-[#5EEAD4] transition hover:bg-[#0F766E] hover:text-white"
                >
                  {language === 'en' ? 'हिन्दी पढ़ें' : 'Read EN'}
                </button>
              </div>

              {/* Trust Guarantees */}
              <div className="grid max-w-lg grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#B8CBC8]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#5EEAD4]" />
                  <span>{t.hero.trustConsentedMemory}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#B8CBC8]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#5EEAD4]" />
                  <span>{t.hero.trustVerifiedFacility}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#B8CBC8]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#5EEAD4]" />
                  <span>{t.hero.trustHumanEscalation}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-[#B8CBC8]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#5EEAD4]" />
                  <span>{t.hero.trustRealtimeAnalytics}</span>
                </div>
              </div>
            </div>

            {/* Right Column: SIGNATURE VOICE CONSOLE IN DARK GLASS SURFACE */}
            <div className="lg:col-span-5" id="voice-pod">
              <div className="glass-panel-dark relative overflow-hidden rounded-3xl border border-[#2A4E49] bg-[#102F2B] p-8 text-center shadow-2xl transition-all">
                {/* Concentric Medical Breathing Pulse Rings */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="animate-pulse-ring size-72 rounded-full border border-[#5EEAD4]/30" />
                  <div className="animate-pulse-ring size-48 rounded-full border border-[#0F766E]/50" />
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
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MAIN BODY CONTAINER WITH NATURAL UNCONSTRAINED SCROLLING */}
      {/* ============================================================ */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 space-y-24 px-4 py-16 sm:px-6 lg:px-8">
        {/* ============================================================ */}
        {/* SECTION 2: SIGNATURE VOICE SHOWCASE — DARK SECTION (#0B2522) */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden rounded-3xl border border-[#2A4E49] bg-[#0B2522] p-8 text-[#F5FAF9] shadow-2xl sm:p-12">
          <div className="relative z-10 space-y-8">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2A4E49] bg-[#102F2B] px-3.5 py-1 text-xs font-bold tracking-wider text-[#5EEAD4] uppercase">
                <Mic className="size-3.5" /> Signature Voice Experience
              </span>
              <h2 className="font-heading text-3xl font-extrabold text-[#F5FAF9] sm:text-4xl">
                Engineered for natural medical conversations.
              </h2>
              <p className="text-sm leading-relaxed text-[#B8CBC8]">
                MEDISATHI continuously tracks voice state transitions with clinical precision.
                Explore how the interface responds:
              </p>
            </div>

            {/* Interactive State Selector Pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(
                [
                  ['ready', 'READY', 'Subtle breathing'],
                  ['connecting', 'CONNECTING', 'Establishing link'],
                  ['listening', 'LISTENING', 'Soft mint pulse'],
                  ['thinking', 'THINKING', 'Processing context'],
                  ['speaking', 'SPEAKING', 'Controlled waveform'],
                  ['ended', 'CALL ENDED', 'Neutral state'],
                  ['error', 'ERROR', 'Soft alert'],
                ] as const
              ).map(([stKey, label, desc]) => (
                <button
                  key={stKey}
                  type="button"
                  onClick={() => setDemoState(stKey as ShowcaseState)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    demoState === stKey
                      ? 'border border-[#5EEAD4] bg-[#163A35] text-[#5EEAD4] shadow-md'
                      : 'border border-[#2A4E49] bg-[#102F2B]/60 text-[#B8CBC8] hover:bg-[#102F2B]'
                  }`}
                >
                  <span>{label}</span>
                  <span className="ml-2 hidden text-[10px] text-[#829A96] sm:inline">{desc}</span>
                </button>
              ))}
            </div>

            {/* Dynamic Voice State Console Card */}
            <div className="glass-panel-dark space-y-6 rounded-2xl border border-[#2A4E49] bg-[#102F2B]/90 p-8 text-center">
              <div className="relative mx-auto flex size-40 items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                    demoState === 'listening'
                      ? 'animate-ping border-[#5EEAD4] opacity-25'
                      : demoState === 'speaking'
                        ? 'scale-110 animate-pulse border-[#0F766E]'
                        : demoState === 'thinking'
                          ? 'animate-spin border-[#D6A756]'
                          : 'border-[#2A4E49]'
                  }`}
                />
                <div className="relative grid size-28 place-items-center rounded-full border border-[#2A4E49] bg-[#163A35] text-[#5EEAD4] shadow-xl">
                  {demoState === 'speaking' ? (
                    <Volume2 className="size-10 animate-bounce text-[#5EEAD4]" />
                  ) : demoState === 'thinking' ? (
                    <Sparkles className="size-10 animate-spin text-[#D6A756]" />
                  ) : demoState === 'listening' ? (
                    <Mic className="size-10 animate-pulse text-[#5EEAD4]" />
                  ) : demoState === 'connecting' ? (
                    <RefreshCw className="size-10 animate-spin text-[#5EEAD4]" />
                  ) : demoState === 'error' ? (
                    <AlertTriangle className="size-10 text-[#DC2626]" />
                  ) : (
                    <Mic className="size-10 text-[#829A96]" />
                  )}
                </div>
              </div>

              <div>
                <span
                  className={`inline-block rounded-full px-3.5 py-1 text-xs font-bold tracking-wider uppercase ${
                    demoState === 'speaking'
                      ? 'border border-[#0F766E] bg-[#0F766E]/30 text-[#5EEAD4]'
                      : demoState === 'listening'
                        ? 'border border-[#5EEAD4]/40 bg-[#5EEAD4]/20 text-[#5EEAD4]'
                        : demoState === 'thinking'
                          ? 'border border-[#D6A756]/40 bg-[#D6A756]/20 text-[#D6A756]'
                          : demoState === 'error'
                            ? 'border border-[#DC2626]/40 bg-[#DC2626]/20 text-[#DC2626]'
                            : 'border border-[#2A4E49] bg-[#163A35] text-[#B8CBC8]'
                  }`}
                >
                  {demoState.toUpperCase()}
                </span>
                <h3 className="font-heading mt-3 text-2xl text-[#F5FAF9]">
                  {demoState === 'speaking'
                    ? t.voiceConsole.speakingTitle
                    : demoState === 'listening'
                      ? t.voiceConsole.listeningTitle
                      : demoState === 'thinking'
                        ? t.voiceConsole.thinkingTitle
                        : demoState === 'connecting'
                          ? t.voiceConsole.connectingTitle
                          : demoState === 'error'
                            ? t.voiceConsole.errorTitle
                            : t.voiceConsole.readyTitle}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs text-[#B8CBC8]">
                  Powered by LiveKit Agent turn detector, Deepgram Nova-3 STT, and Murf Falcon
                  streaming TTS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3: HOW IT WORKS — BRIGHT MEDICAL SECTION (#F7FAF9) */}
        {/* ============================================================ */}
        <section
          id="how-it-works"
          className="scroll-mt-28 space-y-8 border-t border-[#D6E5E1] pt-12"
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <span className="text-xs font-bold tracking-wider text-[#0F766E] uppercase">
                {t.howItWorks.tag}
              </span>
              <h2 className="font-heading mt-2 text-3xl text-[#16302D] sm:text-4xl">
                {t.howItWorks.heading}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-[#526B67]">{t.howItWorks.sub}</p>
          </div>

          <ol className="mt-8 grid divide-y divide-[#D6E5E1] border-y border-[#D6E5E1] md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ['01', t.howItWorks.step1Title, t.howItWorks.step1Desc],
              ['02', t.howItWorks.step2Title, t.howItWorks.step2Desc],
              ['03', t.howItWorks.step3Title, t.howItWorks.step3Desc],
            ].map(([number, title, copy]) => (
              <li key={number} className="px-0 py-6 md:px-8 first:md:pl-0 last:md:pr-0">
                <span className="font-mono text-xs font-bold tracking-wider text-[#D6A756]">
                  {number}
                </span>
                <h3 className="mt-3 text-base font-bold tracking-wide text-[#16302D] uppercase">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#526B67]">{copy}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4: CORE CAPABILITIES — BRIGHT/SOFT MEDICAL SECTION */}
        {/* ============================================================ */}
        <section id="features" className="scroll-mt-28 space-y-8 border-t border-[#D6E5E1] pt-12">
          <div className="space-y-2 text-left">
            <span className="text-xs font-bold tracking-wider text-[#0F766E] uppercase">
              {t.capabilities.tag}
            </span>
            <h2 className="font-heading text-3xl text-[#16302D] sm:text-4xl">
              {t.capabilities.heading}
            </h2>
            <p className="max-w-xl text-sm text-[#526B67]">{t.capabilities.sub}</p>
          </div>

          {/* Asymmetrical Editorial Row Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            {/* Card 1: Symptom Care Triage */}
            <article className="glass-card-light flex flex-col justify-between space-y-4 rounded-3xl p-8 text-left md:col-span-7">
              <div className="space-y-4">
                <div className="grid size-12 place-items-center rounded-2xl border border-[#D6E5E1] bg-[#EEF5F3] text-[#0F766E]">
                  <Stethoscope className="size-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#16302D]">
                  {t.capabilities.triageTitle}
                </h3>
                <p className="text-sm leading-relaxed text-[#526B67]">
                  {t.capabilities.triageDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-[#D6E5E1] pt-4 text-xs font-semibold text-[#0F766E]">
                <ShieldCheck className="size-4 text-[#0F766E]" />
                <span>{t.capabilities.triageBadge}</span>
              </div>
            </article>

            {/* Card 2: Verified Facility Search */}
            <article className="glass-card-light flex flex-col justify-between space-y-4 rounded-3xl p-8 text-left md:col-span-5">
              <div className="space-y-4">
                <div className="grid size-12 place-items-center rounded-2xl border border-[#D6E5E1] bg-[#EEF5F3] text-[#0F766E]">
                  <Building2 className="size-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#16302D]">
                  {t.capabilities.facilityTitle}
                </h3>
                <p className="text-sm leading-relaxed text-[#526B67]">
                  {t.capabilities.facilityDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-[#D6E5E1] pt-4 text-xs font-semibold text-[#0F766E]">
                <Globe className="size-4 text-[#0F766E]" />
                <span>{t.capabilities.facilityBadge}</span>
              </div>
            </article>

            {/* Card 3: Human Escalation */}
            <article className="glass-card-light flex flex-col justify-between space-y-4 rounded-3xl p-8 text-left md:col-span-6">
              <div className="space-y-4">
                <div className="grid size-12 place-items-center rounded-2xl border border-[#D6E5E1] bg-[#EEF5F3] text-[#0F766E]">
                  <UserCheck className="size-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#16302D]">
                  {t.capabilities.escalationTitle}
                </h3>
                <p className="text-sm leading-relaxed text-[#526B67]">
                  {t.capabilities.escalationDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-[#D6E5E1] pt-4 text-xs font-semibold text-[#0F766E]">
                <Lock className="size-4 text-[#0F766E]" />
                <span>{t.capabilities.escalationBadge}</span>
              </div>
            </article>

            {/* Card 4: Consented Memory */}
            <article className="glass-card-light flex flex-col justify-between space-y-4 rounded-3xl p-8 text-left md:col-span-6">
              <div className="space-y-4">
                <div className="grid size-12 place-items-center rounded-2xl border border-[#D6E5E1] bg-[#EEF5F3] text-[#0F766E]">
                  <HeartPulse className="size-6" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-[#16302D]">
                  {t.capabilities.memoryTitle}
                </h3>
                <p className="text-sm leading-relaxed text-[#526B67]">
                  {t.capabilities.memoryDesc}
                </p>
              </div>
              <div className="flex items-center gap-2 border-t border-[#D6E5E1] pt-4 text-xs font-semibold text-[#0F766E]">
                <CheckCircle2 className="size-4 text-[#0F766E]" />
                <span>{t.capabilities.memoryBadge}</span>
              </div>
            </article>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5: TRUST & SAFETY — DARK CLINICAL TEAL SECTION (#134E4A) */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden rounded-3xl border border-[#2A4E49] bg-[#134E4A] p-8 text-left text-[#F5FAF9] shadow-xl md:flex md:items-center md:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#D6A756] uppercase">
              <AlertTriangle className="size-4 text-[#D6A756]" />
              <span>{t.trust.badge}</span>
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-[#F5FAF9] sm:text-3xl">
              {t.trust.heading}
            </h3>
            <p className="text-xs leading-relaxed text-[#B8CBC8]">{t.trust.copy}</p>
          </div>
          <div className="mt-6 shrink-0 md:mt-0">
            <span className="inline-block rounded-xl border border-[#2A4E49] bg-[#102F2B] px-4 py-2.5 text-xs font-bold text-[#5EEAD4]">
              {t.trust.tagRight}
            </span>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6: FINAL CTA — DARK SECTION (#071B19) */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden rounded-3xl border border-[#2A4E49] bg-[#071B19] p-8 text-[#F5FAF9] shadow-2xl sm:p-12">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold tracking-wider text-[#5EEAD4] uppercase">
              {t.cta.tag}
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-[#F5FAF9] sm:text-4xl">
              {t.cta.heading}
            </h2>
            <p className="text-sm leading-relaxed text-[#B8CBC8]">{t.cta.sub}</p>
            <Button
              size="lg"
              onClick={onStartCall}
              className="mt-4 rounded-xl bg-[#0F766E] px-6 text-base font-bold text-white hover:bg-[#115E59]"
            >
              <Mic className="size-4 text-[#5EEAD4]" /> {t.cta.button}{' '}
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="pointer-events-none absolute -right-16 -bottom-24 size-80 rounded-full bg-[#0F766E]/20 blur-3xl" />
        </section>
      </main>

      {/* ============================================================ */}
      {/* SECTION 7: FOOTER — DARK SECTION (#071B19) */}
      {/* ============================================================ */}
      <footer className="relative z-10 border-t border-[#2A4E49] bg-[#071B19] py-8 text-center text-xs text-[#829A96]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <MediSathiLogo size={28} variant="dark" showText={true} />
          <p>
            © 2026 MEDISATHI Health Access Platform · Powered by Murf Falcon TTS &amp; LiveKit
            Agents
          </p>
        </div>
      </footer>
    </div>
  );
};

function WelcomeAction({ status, startButtonText, onStartCall }: WelcomeViewProps) {
  const { t } = useLanguage();
  const connecting = status === 'connecting';
  const ended = status === 'ended';

  return (
    <div className="relative z-10 flex flex-col items-center">
      {/* Signature Dark Glass Microphone Pod */}
      <button
        type="button"
        className="group relative mb-6 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5EEAD4]"
        onClick={onStartCall}
        disabled={connecting}
        aria-label={ended ? 'Start a new MEDISATHI conversation' : 'Start a MEDISATHI conversation'}
      >
        <div className="grid size-28 place-items-center rounded-full border border-[#2A4E49] bg-gradient-to-b from-[#163A35] to-[#0F766E] text-[#5EEAD4] shadow-2xl transition duration-300 group-hover:scale-105 sm:size-32">
          {connecting ? (
            <span className="size-10 animate-spin rounded-full border-3 border-[#5EEAD4] border-t-transparent" />
          ) : ended ? (
            <RefreshCw className="size-10 text-[#B8CBC8]" />
          ) : (
            <Mic className="size-10 animate-pulse text-[#5EEAD4]" />
          )}
        </div>
      </button>

      {/* Assistant Status Title & Copy */}
      <h2 className="font-heading text-2xl font-bold text-[#F5FAF9] sm:text-3xl">
        {connecting
          ? t.voiceConsole.connectingTitle
          : ended
            ? t.voiceConsole.endedTitle
            : t.voiceConsole.readyTitle}
      </h2>

      <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#B8CBC8]">
        {connecting
          ? t.voiceConsole.connectingSub
          : ended
            ? t.voiceConsole.endedSub
            : t.voiceConsole.readySub}
      </p>

      {/* Primary Action Button */}
      <Button
        size="lg"
        disabled={connecting}
        onClick={onStartCall}
        className="mt-6 h-13 w-full max-w-xs rounded-2xl bg-[#0F766E] text-base font-bold text-[#FFFFFF] shadow-lg shadow-[#0F766E]/30 transition hover:bg-[#115E59] active:scale-[0.98]"
        aria-label={ended ? 'Start new conversation' : 'Start conversation with MEDISATHI'}
      >
        <Mic className="mr-2 size-5 text-[#5EEAD4]" />
        {ended ? t.voiceConsole.newSessionButton : t.voiceConsole.startButton}
      </Button>

      {/* Privacy Notice */}
      <span className="mt-4 flex items-center gap-1.5 text-[11px] text-[#829A96]">
        <Lock className="size-3 text-[#5EEAD4]" /> {t.voiceConsole.privacyNotice}
      </span>
    </div>
  );
}

function MicrophoneError({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <div className="relative z-10 space-y-4 text-left">
      <div className="grid size-12 place-items-center rounded-2xl border border-[#DC2626]/40 bg-[#DC2626]/15 text-[#DC2626]">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="font-heading text-xl font-bold text-[#F5FAF9]">Microphone Access Required</h2>
      <p className="text-xs leading-relaxed text-[#B8CBC8]">
        MEDISATHI needs microphone permission to conduct natural voice conversations.
      </p>
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
      <div className="grid size-12 place-items-center rounded-2xl border border-[#DC2626]/40 bg-[#DC2626]/15 text-[#DC2626]">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="font-heading text-xl font-bold text-[#F5FAF9]">Connection Unavailable</h2>
      <p className="text-xs leading-relaxed text-[#B8CBC8]">
        We couldn&apos;t connect to the MEDISATHI voice server. Please check your internet and try
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
