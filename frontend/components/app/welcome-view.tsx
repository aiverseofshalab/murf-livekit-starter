import Link from 'next/link';
import { Activity, HeartPulse, Mic, RefreshCw, ShieldCheck, Stethoscope } from 'lucide-react';
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
  <div ref={ref} className="min-h-svh overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="medisathi-orb grid size-10 place-items-center rounded-xl text-cyan-200">
          <HeartPulse aria-hidden="true" />
        </span>
        <span>
          <strong className="block text-lg tracking-tight">MediSathi</strong>
          <span className="text-muted-foreground text-xs">Your Friendly AI Health Companion</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="medisathi-pill hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-cyan-100 sm:flex">
          <ShieldCheck className="size-4" /> Private &amp; supportive
        </span>
        <Link
          href="/dashboard"
          className="medisathi-pill flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-white/10"
        >
          Operations Dashboard
        </Link>
      </div>
    </header>

    <main className="mx-auto flex w-full max-w-4xl flex-col items-center pt-10 pb-10 text-center sm:pt-16">
      <span className="medisathi-pill mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-100">
        <Activity className="size-3.5" /> AI VOICE HEALTHCARE ASSISTANT
      </span>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl">
        A calm, simple place to talk about{' '}
        <span className="bg-linear-to-r from-cyan-200 to-violet-300 bg-clip-text text-transparent">
          your health.
        </span>
      </h1>
      <p className="text-muted-foreground mt-5 max-w-xl text-base leading-7 sm:text-lg">
        Talk naturally with MediSathi to get simple, general health information and guidance.
      </p>
      <section
        aria-live="polite"
        className="medisathi-glass mt-8 w-full max-w-xl rounded-3xl p-6 sm:p-8"
      >
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
      </section>
      <FeatureCards />
      <p className="medisathi-glass mt-8 max-w-3xl rounded-2xl px-4 py-3 text-left text-xs leading-5 text-slate-300 sm:text-sm">
        <span className="text-cyan-200">⚕️</span> MediSathi provides general health information and
        is not a substitute for professional medical advice. For emergencies or serious symptoms,
        contact a qualified healthcare professional or local emergency service.
      </p>
    </main>
    <footer className="border-primary/10 text-muted-foreground mx-auto flex max-w-6xl justify-center border-t pt-5 text-xs">
      MediSathi · Powered by Murf Falcon
    </footer>
  </div>
);

function WelcomeAction({ status, startButtonText, onStartCall }: WelcomeViewProps) {
  const connecting = status === 'connecting';
  const ended = status === 'ended';
  return (
    <>
      <div className="medisathi-orb mx-auto mb-5 grid size-20 place-items-center rounded-full text-cyan-100">
        {connecting ? (
          <span className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
        ) : ended ? (
          <RefreshCw className="size-7" />
        ) : (
          <Mic className="size-7" />
        )}
      </div>
      <h2 className="text-xl font-bold">
        {connecting
          ? 'Connecting to MediSathi...'
          : ended
            ? 'Conversation ended'
            : 'MediSathi is ready'}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        {connecting
          ? 'Please wait while we connect you.'
          : ended
            ? 'Thank you for talking with MediSathi.'
            : 'Tap the button below to start your conversation.'}
      </p>
      <Button
        size="lg"
        disabled={connecting}
        onClick={onStartCall}
        className="medisathi-action mt-6 h-12 w-full rounded-xl text-base font-semibold"
      >
        <Mic className="size-5" /> {ended ? 'Start Again' : startButtonText}
      </Button>
    </>
  );
}
function MicrophoneError({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <div className="text-left">
      <div className="mb-4 grid size-12 place-items-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-300">
        <Mic className="size-6" />
      </div>
      <h2 className="text-xl font-bold">Microphone Access Required</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        MediSathi needs microphone access to hear you.
      </p>
      <ol className="text-muted-foreground mt-4 list-decimal space-y-1 pl-5 text-sm">
        <li>Click the microphone icon in your browser&apos;s address bar.</li>
        <li>Allow microphone access for this website.</li>
        <li>Reload the page and try again.</li>
      </ol>
      <Button onClick={onTryAgain} className="medisathi-action mt-6 w-full rounded-xl">
        <RefreshCw /> Try Again
      </Button>
    </div>
  );
}
function ConnectionError({ onTryAgain }: { onTryAgain: () => void }) {
  return (
    <div>
      <h2 className="text-xl font-bold">We couldn&apos;t connect to MediSathi</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Please check your internet connection and try again .
      </p>
      <Button onClick={onTryAgain} className="medisathi-action mt-6 w-full rounded-xl">
        <RefreshCw /> Try Again
      </Button>
    </div>
  );
}
function FeatureCards() {
  const cards = [
    [Stethoscope, 'Symptom Guidance', 'Discuss common symptoms in simple language.'],
    [HeartPulse, 'Health Information', 'Learn about general health topics and precautions.'],
    [Mic, 'Simple Conversations', 'Ask questions naturally using your voice.'],
    [
      ShieldCheck,
      'Privacy First',
      'Your conversation experience is designed with privacy in mind.',
    ],
  ] as const;
  return (
    <div className="mt-10 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
      {cards.map(([Icon, title, copy]) => (
        <article
          key={title}
          className="medisathi-glass rounded-2xl p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_18px_45px_rgba(34,211,238,0.10)]"
        >
          <Icon className="mb-3 size-5 text-cyan-200" />
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-5">{copy}</p>
        </article>
      ))}
    </div>
  );
}
