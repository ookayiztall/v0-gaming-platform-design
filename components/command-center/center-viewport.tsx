'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader } from 'lucide-react';
import { Card } from '@/components/ui/card';

type ViewportModule = 'welcome' | 'chat' | 'games' | 'tournaments';

// Dynamically import modules
const WelcomeModule = dynamic(() => import('./modules/welcome-module'), {
  loading: () => <ModuleLoading />,
});

const ChatModule = dynamic(() => import('./modules/chat-module'), {
  loading: () => <ModuleLoading />,
});

const GamesModule = dynamic(() => import('./modules/games-module'), {
  loading: () => <ModuleLoading />,
});

const TournamentsModule = dynamic(() => import('./modules/tournaments-module'), {
  loading: () => <ModuleLoading />,
});

function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

interface CenterViewportProps {
  activeModule: ViewportModule;
  setActiveModule: (module: ViewportModule) => void;
  spaceId?: string;
  isPrivateSpace: boolean;
}

export default function CenterViewport({
  activeModule,
  setActiveModule,
  spaceId,
  isPrivateSpace,
}: CenterViewportProps) {
  return (
    <Card className="bg-gradient-to-br from-card/60 via-card/40 to-primary/5 border-primary/20 overflow-hidden h-full min-h-[calc(100vh-120px)]">
      <div className="overflow-y-auto h-full">
        <Suspense fallback={<ModuleLoading />}>
          {activeModule === 'welcome' && (
            <WelcomeModule spaceId={spaceId} isPrivateSpace={isPrivateSpace} />
          )}
          {activeModule === 'chat' && (
            <ChatModule spaceId={spaceId} />
          )}
          {activeModule === 'games' && (
            <GamesModule spaceId={spaceId} />
          )}
          {activeModule === 'tournaments' && (
            <TournamentsModule spaceId={spaceId} />
          )}
        </Suspense>
      </div>
    </Card>
  );
}
