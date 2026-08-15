'use client';

import { useState } from 'react';
import { Mic, PhoneOff, Sparkles, Volume2 } from 'lucide-react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { MediSathiLogo } from '@/components/app/medisathi-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';
import { AudioVisualizer } from './audio-visualizer';

export interface AgentSessionView_01Props {
  preConnectMessage?: string;
  supportsChatInput?: boolean;
  supportsVideoInput?: boolean;
  supportsScreenShare?: boolean;
  isPreConnectBufferEnabled?: boolean;
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerWaveLineWidth?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerBarCount?: number;
  className?: string;
}

export function AgentSessionView_01({
  audioVisualizerType = 'aura',
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerWaveLineWidth,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const agent = useAgent();
  const { messages } = useSessionMessages(session);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const latestAgentText =
    [...messages]
      .reverse()
      .find((m) => !m.from?.isLocal)
      ?.message?.toLowerCase() ?? '';
  const isSpecialistActive =
    latestAgentText.includes('clinic and appointment specialist') ||
    latestAgentText.includes('clinic specialist') ||
    (latestAgentText.includes('specialist') && latestAgentText.includes('clinic'));

  const activeAgentName = isSpecialistActive ? 'Clinic & Appointment Specialist' : 'MediSathi';

  const speaking = agent.state === 'speaking';
  const listening = agent.state === 'listening' || agent.state === 'pre-connect-buffering';
  const thinking = agent.state === 'thinking';
  const waiting = !speaking && !listening;

  const statusTitle = speaking
    ? `${activeAgentName} is speaking`
    : listening
      ? 'Listening to you'
      : thinking
        ? 'Thinking...'
        : `Connecting to ${activeAgentName}...`;

  const statusCopy = speaking
    ? `Please wait while ${activeAgentName} responds...`
    : listening
      ? "Go ahead, I'm listening..."
      : thinking
        ? 'MediSathi is preparing a thoughtful response.'
        : 'Preparing a safe, private voice connection.';

  return (
    <section
      ref={ref}
      className={cn(
        'relative min-h-screen overflow-y-auto bg-[#071B19] px-4 py-6 text-[#F5FAF9] antialiased sm:px-6',
        className
      )}
      {...props}
    >
      {/* Background Soft Atmospheric Lighting */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-[#0F766E]/15 blur-3xl" />
        <div className="absolute right-10 bottom-10 size-72 rounded-full bg-[#5EEAD4]/10 blur-2xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between border-b border-[#2A4E49] pb-4">
        <div className="flex items-center gap-3">
          <MediSathiLogo size={40} variant="dark" showText={true} />
          <div className="text-left">
            <strong className="font-heading block text-lg text-[#F5FAF9]">
              {isSpecialistActive ? 'MEDISATHI Clinic Specialist' : 'MEDISATHI'}
            </strong>
            <span className="text-xs text-[#B8CBC8]">
              {isSpecialistActive
                ? 'Clinic & Appointment Specialist (Male Voice: Karan)'
                : 'Your AI Voice Health Companion (Female Voice: Anisha)'}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'rounded-full border px-3.5 py-1 text-xs font-bold transition',
            isSpecialistActive
              ? 'border-[#D6A756] bg-[#163A35] text-[#D6A756]'
              : 'border-[#5EEAD4]/40 bg-[#102F2B] text-[#5EEAD4]'
          )}
        >
          {isSpecialistActive ? '● Specialist Active' : '● Live Voice Session'}
        </span>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col items-center py-8 text-center sm:py-12">
        <div className="glass-panel-dark w-full rounded-3xl border border-[#2A4E49] bg-[#102F2B]/90 p-6 shadow-2xl sm:p-10">
          <div
            className={cn(
              'relative mx-auto grid size-64 place-items-center sm:size-80',
              listening && 'text-[#5EEAD4]',
              speaking && 'text-[#5EEAD4]'
            )}
          >
            <div
              className={cn(
                'animate-pulse-ring absolute inset-4 rounded-full border border-[#5EEAD4]/30 bg-[#5EEAD4]/5',
                waiting && 'hidden'
              )}
            />
            <div className="relative z-10 grid size-40 place-items-center rounded-full border border-[#2A4E49] bg-[#163A35] shadow-2xl sm:size-48">
              <AudioVisualizer
                isChatOpen={false}
                audioVisualizerType={audioVisualizerType}
                audioVisualizerColor={audioVisualizerColor || '#5EEAD4'}
                audioVisualizerColorShift={audioVisualizerColorShift}
                audioVisualizerBarCount={audioVisualizerBarCount}
                audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
                audioVisualizerRadialRadius={audioVisualizerRadialRadius}
                audioVisualizerGridRowCount={audioVisualizerGridRowCount}
                audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
                audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
                className="scale-[.35] sm:scale-[.42]"
              />
            </div>
          </div>

          <div aria-live="polite" className="mt-4">
            <div className="mb-3 flex justify-center text-[#5EEAD4]">
              {speaking ? (
                <Volume2 className="size-8 animate-bounce text-[#5EEAD4]" />
              ) : listening ? (
                <Mic className="size-8 animate-pulse text-[#5EEAD4]" />
              ) : (
                <Sparkles className="size-8 animate-spin text-[#D6A756]" />
              )}
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F5FAF9] sm:text-3xl">
              {statusTitle}
            </h1>
            <p className="mt-2 text-xs text-[#B8CBC8]">{statusCopy}</p>
          </div>

          <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setTranscriptOpen((open) => !open)}
              className="rounded-xl border-[#2A4E49] bg-[#163A35] text-[#5EEAD4] hover:bg-[#102F2B]"
            >
              {transcriptOpen ? 'Hide Transcript' : 'View Transcript'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => session.end()}
              className="rounded-xl bg-[#DC2626] font-semibold text-[#FFFFFF] hover:bg-[#b91c1c] sm:flex-1"
            >
              <PhoneOff className="mr-2 size-4" /> End Conversation
            </Button>
          </div>

          {transcriptOpen && (
            <section
              aria-label="Conversation transcript"
              className="mx-auto mt-6 h-60 w-full max-w-xl overflow-hidden rounded-2xl border border-[#2A4E49] bg-[#071B19] text-left shadow-lg"
            >
              <div className="border-b border-[#2A4E49] bg-[#102F2B] px-4 py-2.5 text-xs font-semibold text-[#B8CBC8]">
                Live Transcript
              </div>
              <AgentChatTranscript
                agentState={agent.state}
                messages={messages}
                className="h-48 text-xs text-[#F5FAF9] [&>div>div]:px-4 [&>div>div]:py-2"
              />
            </section>
          )}

          <p className="mx-auto mt-8 max-w-2xl text-[11px] leading-5 text-[#829A96]">
            ⚕️ MEDISATHI provides general health information only. It does not diagnose conditions
            or replace a qualified healthcare professional.
          </p>
        </div>
      </main>
    </section>
  );
}
