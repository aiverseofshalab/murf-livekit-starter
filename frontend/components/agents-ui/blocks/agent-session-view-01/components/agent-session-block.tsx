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
  const speaking = agent.state === 'speaking';
  const listening = agent.state === 'listening' || agent.state === 'pre-connect-buffering';
  const waiting = !speaking && !listening;
  const statusTitle = speaking
    ? 'MediSathi is speaking'
    : listening
      ? 'Listening to you'
      : 'Connecting to MediSathi...';
  const statusCopy = speaking
    ? 'Please wait while MediSathi responds...'
    : listening
      ? "Go ahead, I'm listening..."
      : 'Preparing a safe, private voice connection.';

  return (
    <section
      ref={ref}
      className={cn('min-h-svh overflow-y-auto px-4 py-6 sm:px-6', className)}
      {...props}
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="medisathi-orb grid size-10 place-items-center rounded-xl text-cyan-200">
            <HeartPulse />
          </span>
          <span>
            <strong className="block text-lg">MediSathi</strong>
            <span className="text-muted-foreground text-xs">Your Friendly AI Health Companion</span>
          </span>
        </div>
        <span className="medisathi-pill hidden rounded-full px-3 py-1.5 text-xs font-semibold text-cyan-100 sm:block">
          Secure voice session
        </span>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col items-center py-8 text-center sm:py-12">
        <div className="medisathi-glass w-full rounded-[28px] px-4 py-7 sm:px-8 sm:py-10">
          <div
            className={cn(
              'relative mx-auto grid size-64 place-items-center sm:size-80',
              listening && 'text-primary',
              speaking && 'text-cyan-300'
            )}
          >
            <div
              className={cn(
                'medisathi-pulse absolute inset-4 rounded-full bg-current',
                waiting && 'hidden'
              )}
            />
            <div className="medisathi-orb relative z-10 grid size-40 place-items-center rounded-full sm:size-48">
              <AudioVisualizer
                isChatOpen={false}
                audioVisualizerType={audioVisualizerType}
                audioVisualizerColor={audioVisualizerColor}
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
          <div aria-live="polite" className="mt-2">
            <div className="text-primary mb-3 flex justify-center">
              {speaking ? (
                <Volume2 className="size-7" />
              ) : listening ? (
                <Mic className="size-7" />
              ) : (
                <Sparkles className="size-7 animate-pulse" />
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              {statusTitle}
            </h1>
            <p className="text-muted-foreground mt-2">{statusCopy}</p>
          </div>
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setTranscriptOpen((open) => !open)}
              className="medisathi-pill rounded-xl border-0 text-slate-200 hover:bg-white/10"
            >
              {transcriptOpen ? 'Hide conversation' : 'View conversation'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => session.end()}
              className="medisathi-danger rounded-xl sm:flex-1"
            >
              <PhoneOff /> End Conversation
            </Button>
          </div>
          {transcriptOpen && (
            <section
              aria-label="Conversation transcript"
              className="medisathi-glass mt-6 h-56 w-full max-w-xl overflow-hidden rounded-2xl text-left"
            >
              <div className="border-b px-4 py-3 text-sm font-semibold">Conversation</div>
              <AgentChatTranscript
                agentState={agent.state}
                messages={messages}
                className="h-44 [&>div>div]:px-4 [&>div>div]:py-3"
              />
            </section>
          )}
          <p className="text-muted-foreground mt-8 max-w-2xl text-xs leading-5">
            ⚕️ MediSathi shares general health information only. It does not diagnose conditions or
            replace a qualified healthcare professional.
          </p>
        </div>
      </main>
    </section>
  );
}
