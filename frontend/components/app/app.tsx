'use client';

import { useMemo } from 'react';
import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import type { AppConfig } from '@/app-config';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/ui/sonner';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { LanguageProvider } from '@/lib/language-context';
import { getSandboxTokenSource } from '@/lib/utils';

const MEDISATHI_USER_ID_KEY = 'medisathi_user_id';

function getMediSathiUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-user';
  }
  const savedId = window.localStorage.getItem(MEDISATHI_USER_ID_KEY);
  if (savedId) return savedId;

  const userId = crypto.randomUUID();
  window.localStorage.setItem(MEDISATHI_USER_ID_KEY, userId);
  return userId;
}

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const tokenSource = useMemo(() => {
    const userId = getMediSathiUserId();
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig, userId)
      : TokenSource.custom(async () => {
          const response = await fetch('/api/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId }),
          });
          if (!response.ok) throw new Error('Unable to create a LiveKit token.');
          return response.json();
        });
  }, [appConfig]);

  const session = useSession(
    tokenSource,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  return (
    <LanguageProvider>
      <AgentSessionProvider session={session}>
        <AppSetup />
        <main className="min-h-screen w-full">
          <ViewController appConfig={appConfig} />
        </main>
        <StartAudioButton label="Start Audio" />
        <Toaster
          icons={{
            warning: <WarningIcon weight="bold" />,
          }}
          position="top-center"
          className="toaster group"
          style={
            {
              '--normal-bg': 'var(--popover)',
              '--normal-text': 'var(--popover-foreground)',
              '--normal-border': 'var(--border)',
            } as React.CSSProperties
          }
        />
      </AgentSessionProvider>
    </LanguageProvider>
  );
}
