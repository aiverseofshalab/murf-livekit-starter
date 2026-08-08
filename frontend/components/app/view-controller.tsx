'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { SessionEvent, useAgent, useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const session = useSessionContext();
  const agent = useAgent();
  const { resolvedTheme } = useTheme();
  const [welcomeStatus, setWelcomeStatus] = useState<
    'ready' | 'connecting' | 'ended' | 'microphone-error' | 'connection-error'
  >('ready');
  const hasStarted = useRef(false);

  useEffect(() => {
    const handleMediaError = () => setWelcomeStatus('microphone-error');
    session.internal.emitter.on(SessionEvent.MediaDevicesError, handleMediaError);
    return () => {
      session.internal.emitter.off(SessionEvent.MediaDevicesError, handleMediaError);
    };
  }, [session]);

  useEffect(() => {
    if (agent.state === 'failed') setWelcomeStatus('connection-error');
  }, [agent.state]);

  useEffect(() => {
    if (session.isConnected) {
      setWelcomeStatus('ready');
    } else if (hasStarted.current && welcomeStatus === 'ready' && agent.state !== 'failed') {
      setWelcomeStatus('ended');
    }
  }, [agent.state, session.isConnected, welcomeStatus]);

  const start = useCallback(async () => {
    hasStarted.current = true;
    setWelcomeStatus('connecting');
    try {
      await session.start({ tracks: { microphone: { enabled: true } } });
    } catch (error) {
      const mediaErrorNames = [
        'AbortError',
        'NotAllowedError',
        'NotFoundError',
        'NotReadableError',
        'OverconstrainedError',
      ];
      setWelcomeStatus(
        error instanceof Error && mediaErrorNames.includes(error.name)
          ? 'microphone-error'
          : 'connection-error'
      );
    }
  }, [session]);

  const hasActiveSession = session.isConnected || welcomeStatus === 'connecting';

  return (
    <AnimatePresence mode="wait">
      {/* Welcome view */}
      {!hasActiveSession && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={start}
          status={welcomeStatus}
        />
      )}
      {/* Session view */}
      {session.isConnected && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}
