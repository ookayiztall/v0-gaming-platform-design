'use client';

import { useState } from 'react';
import ModulePanel from './module-panel';
import CenterViewport from './center-viewport';
import { GamepadIcon, MessageCircle, Mail, Music, Trophy, Swords, Calendar, Home } from 'lucide-react';

type ModuleType = 'games' | 'chat' | 'messages' | 'spotify' | 'leaderboard' | 'tournaments' | 'events' | 'welcome';

interface Module {
  id: ModuleType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const MODULES: Module[] = [
  { id: 'games', label: 'Games', icon: <GamepadIcon className="h-5 w-5" /> },
  { id: 'chat', label: 'General Chat', icon: <MessageCircle className="h-5 w-5" /> },
  { id: 'messages', label: 'Direct Messages', icon: <Mail className="h-5 w-5" /> },
  { id: 'spotify', label: 'Spotify', icon: <Music className="h-5 w-5" /> },
  { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="h-5 w-5" /> },
  { id: 'tournaments', label: 'Tournaments', icon: <Swords className="h-5 w-5" /> },
  { id: 'events', label: 'Events', icon: <Calendar className="h-5 w-5" /> },
];

interface CommandCenterLayoutProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  user?: any;
  space?: any;
}

export default function CommandCenterLayout({
  activeModule,
  setActiveModule,
  user,
  space,
}: CommandCenterLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
            {space && <span className="text-sm text-muted-foreground">({space.name})</span>}
          </div>
          <div className="text-sm text-muted-foreground">
            {user?.email}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[calc(100vh-120px)]">
          {/* Left Sidebar - Module Panel */}
          <div className="lg:col-span-2">
            <ModulePanel
              modules={MODULES}
              activeModule={activeModule}
              onModuleSelect={setActiveModule}
            />
          </div>

          {/* Center Viewport */}
          <div className="lg:col-span-8">
            <CenterViewport
              activeModule={activeModule}
              space={space}
              user={user}
            />
          </div>

          {/* Right Sidebar - Secondary Modules */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Friends Online</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>3 friends online</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur p-4">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Stats</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points</span>
                  <span className="font-semibold">2,450</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
