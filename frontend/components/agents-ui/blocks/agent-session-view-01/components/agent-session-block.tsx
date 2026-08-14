'use client';

import { useState } from 'react';
import { HeartPulse, Mic, PhoneOff, Sparkles, Volume2 } from 'lucide-react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
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
  const waiting = !speaking && !listening;

  const statusTitle = speaking
    ? `${activeAgentName} is speaking`
    : listening
      ? 'Listening to you'
      : `Connecting to ${activeAgentName}...`;

  const statusCopy = speaking
    ? `Please wait while ${activeAgentName} responds...`
    : listening
      ? "Go ahead, I'm listening..."
      : 'Preparing a safe, private voice connection.';

  return (
    <section
      ref={ref}
      className={cn(
        'relative min-h-screen overflow-y-auto bg-[#F6FBFA] px-4 py-6 text-[#123532] sm:px-6',
        className
      )}
      {...props}
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-[rgba(15,118,110,0.12)] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-[rgba(15,118,110,0.16)] bg-[#0F766E] text-[#FFFFFF]">
            <HeartPulse />
          </span>
          <div className="text-left">
            <strong className="block font-serif text-lg text-[#123532]">
              {isSpecialistActive ? 'MediSathi Clinic Specialist' : 'MediSathi'}
            </strong>
            <span className="text-xs text-[#78918D]">
              {isSpecialistActive
                ? 'Clinic & Appointment Specialist (Male Voice: Karan)'
                : 'Your Friendly AI Health Companion (Female Voice: Anisha)'}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'rounded-full border px-3.5 py-1 text-xs font-semibold transition',
            isSpecialistActive
              ? 'border-[#D6A756] bg-[#FFFFFF] text-[#D6A756]'
              : 'border-[rgba(15,118,110,0.2)] bg-[#E7F4F1] text-[#0F766E]'
          )}
        >
          {isSpecialistActive ? '● Specialist Active' : '● Live Voice Session'}
        </span>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col items-center py-8 text-center sm:py-12">
        <div className="glass-panel w-full rounded-3xl p-6 shadow-xl sm:p-10">
          <div
            className={cn(
              'relative mx-auto grid size-64 place-items-center sm:size-80',
              listening && 'text-[#0F766E]',
              speaking && 'text-[#0F766E]'
            )}
          >
            <div
              className={cn(
                'animate-pulse-ring absolute inset-4 rounded-full border border-[rgba(15,118,110,0.2)] bg-[#0F766E]/5',
                waiting && 'hidden'
              )}
            />
            <div className="relative z-10 grid size-40 place-items-center rounded-full border border-[rgba(15,118,110,0.2)] bg-[#FFFFFF] shadow-2xl sm:size-48">
              <AudioVisualizer
                isChatOpen={false}
                audioVisualizerType={audioVisualizerType}
                audioVisualizerColor={audioVisualizerColor || '#0f766e'}
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
            <div className="mb-3 flex justify-center text-[#0F766E]">
              {speaking ? (
                <Volume2 className="size-7 animate-pulse" />
              ) : listening ? (
                <Mic className="size-7 animate-pulse" />
              ) : (
                <Sparkles className="size-7 animate-pulse text-[#D6A756]" />
              )}
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#123532] sm:text-3xl">
              {statusTitle}
            </h1>
            <p className="mt-2 text-xs text-[#526C68]">{statusCopy}</p>
          </div>
          <div className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setTranscriptOpen((open) => !open)}
              className="rounded-xl border-[rgba(15,118,110,0.16)] bg-[#FFFFFF] text-[#0F766E] hover:bg-[#EEF7F5]"
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
              className="mx-auto mt-6 h-60 w-full max-w-xl overflow-hidden rounded-2xl border border-[rgba(15,118,110,0.12)] bg-[#FFFFFF] text-left shadow-sm"
            >
              <div className="border-b border-[rgba(15,118,110,0.12)] bg-[#EEF7F5] px-4 py-2.5 text-xs font-semibold text-[#78918D]">
                Live Transcript
              </div>
              <AgentChatTranscript
                agentState={agent.state}
                messages={messages}
                className="h-48 text-xs [&>div>div]:px-4 [&>div>div]:py-2"
              />
            </section>
          )}
          <p className="mx-auto mt-8 max-w-2xl text-[11px] leading-5 text-[#78918D]">
            ⚕️ MediSathi provides general health information only. It does not diagnose conditions
            or replace a qualified healthcare professional.
          </p>
        </div>
      </main>
    </section>
  );
}
