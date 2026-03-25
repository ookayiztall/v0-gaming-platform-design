'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import ChatRoomsCard from './cards/chat-rooms-card';
import GamesCard from './cards/games-card';
import TournamentsCard from './cards/tournaments-card';
import FriendsCard from './cards/friends-card';
import SpotifyCard from './cards/spotify-card';
import LeaderboardCard from './cards/leaderboard-card';
import CenterViewport from './center-viewport';

type ViewportModule = 'welcome' | 'chat' | 'games' | 'tournaments';

interface CommandCenterLayoutProps {
  spaceId?: string;
  isPrivateSpace: boolean;
}

export default function CommandCenterLayout({
  spaceId,
  isPrivateSpace,
}: CommandCenterLayoutProps) {
  const [activeModule, setActiveModule] = useState<ViewportModule>('welcome');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-12 gap-4 p-6 min-h-screen">
        {/* LEFT SIDEBAR - Interactive Module Cards */}
        <div className="col-span-3 overflow-y-auto space-y-4 pr-2">
          {/* Chat Rooms */}
          <div>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Chat Rooms</h2>
            <ChatRoomsCard
              spaceId={spaceId}
              onSelect={() => setActiveModule('chat')}
              isActive={activeModule === 'chat'}
            />
          </div>

          {/* Games */}
          <div>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Games</h2>
            <GamesCard
              spaceId={spaceId}
              onSelectGame={() => setActiveModule('games')}
              isActive={activeModule === 'games'}
            />
          </div>

          {/* Tournaments */}
          <div>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Tournaments</h2>
            <TournamentsCard
              spaceId={spaceId}
              onSelect={() => setActiveModule('tournaments')}
              isActive={activeModule === 'tournaments'}
            />
          </div>
        </div>

        {/* CENTER VIEWPORT - Main Interactive Content */}
        <div className="col-span-6">
          <CenterViewport
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            spaceId={spaceId}
            isPrivateSpace={isPrivateSpace}
          />
        </div>

        {/* RIGHT SIDEBAR - Quick Stat Cards */}
        <div className="col-span-3 overflow-y-auto space-y-4 pl-2">
          {/* Friends */}
          <div>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Friends</h2>
            <FriendsCard />
          </div>

          {/* Spotify */}
          <div>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Spotify</h2>
            <SpotifyCard />
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">Leaderboard</h2>
            <LeaderboardCard spaceId={spaceId} />
          </div>
        </div>
      </div>
    </div>
  );
}
