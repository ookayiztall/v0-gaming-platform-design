'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader } from 'lucide-react';

type ModuleType = 'games' | 'chat' | 'messages' | 'spotify' | 'leaderboard' | 'tournaments' | 'events' | 'welcome';

// Dynamically import module components
const WelcomeModule = dynamic(() => import('./modules/welcome-module'), {
  loading: () => <ModuleLoading />,
});

const GamesModule = dynamic(() => import('./modules/games-module'), {
  loading: () => <ModuleLoading />,
});

const ChatModule = dynamic(() => import('./modules/chat-module'), {
  loading: () => <ModuleLoading />,
});

const MessagesModule = dynamic(() => import('./modules/messages-module'), {
  loading: () => <ModuleLoading />,
});

const SpotifyModule = dynamic(() => import('./modules/spotify-module'), {
  loading: () => <ModuleLoading />,
});

const LeaderboardModule = dynamic(() => import('./modules/leaderboard-module'), {
  loading: () => <ModuleLoading />,
});

const TournamentsModule = dynamic(() => import('./modules/tournaments-module'), {
  loading: () => <ModuleLoading />,
});

const EventsModule = dynamic(() => import('./modules/events-module'), {
  loading: () => <ModuleLoading />,
});

function ModuleLoading() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading module...</p>
      </div>
    </div>
  );
}

interface CenterViewportProps {
  activeModule: ModuleType;
  space?: any;
  user?: any;
}

export default function CenterViewport({
  activeModule,
  space,
  user,
}: CenterViewportProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur overflow-hidden min-h-[600px]">
      <Suspense fallback={<ModuleLoading />}>
        {activeModule === 'welcome' && <WelcomeModule user={user} space={space} />}
        {activeModule === 'games' && <GamesModule space={space} />}
        {activeModule === 'chat' && <ChatModule space={space} />}
        {activeModule === 'messages' && <MessagesModule user={user} />}
        {activeModule === 'spotify' && <SpotifyModule user={user} />}
        {activeModule === 'leaderboard' && <LeaderboardModule space={space} />}
        {activeModule === 'tournaments' && <TournamentsModule space={space} />}
        {activeModule === 'events' && <EventsModule space={space} />}
      </Suspense>
    </div>
  );
}
