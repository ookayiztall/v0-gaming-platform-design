'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, GamepadIcon, MessageCircle, Music } from 'lucide-react';

interface WelcomeModuleProps {
  spaceId?: string;
  isPrivateSpace: boolean;
}

export default function WelcomeModule({ spaceId, isPrivateSpace }: WelcomeModuleProps) {
  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Sparkles className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          Welcome to Command Center
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Your all-in-one hub for gaming, social interaction, and entertainment. Control everything from one screen.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <GamepadIcon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-foreground">Start Gaming</h3>
          </div>
          <p className="text-sm text-muted-foreground">Jump into your favorite games instantly</p>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/15 hover:to-accent/10 transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-foreground">Chat</h3>
          </div>
          <p className="text-sm text-muted-foreground">Connect with your community</p>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/15 hover:to-green-500/10 transition-all cursor-pointer group">
          <div className="flex items-center gap-3 mb-3">
            <Music className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-foreground">Spotify</h3>
          </div>
          <p className="text-sm text-muted-foreground">Stream music while you play</p>
        </Card>
      </div>

      {/* Space Info */}
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 border-border/50 bg-card/30">
          <h3 className="font-semibold text-foreground mb-2">You're in {isPrivateSpace ? 'a Private' : 'the Public'} Space</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isPrivateSpace 
              ? 'This is a private community space with restricted access. Only invited members can join.'
              : 'This is the public gaming space where everyone can participate and connect.'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold text-foreground">{isPrivateSpace ? 'Private' : 'Public'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visibility</p>
              <p className="font-semibold text-foreground">{isPrivateSpace ? 'Members Only' : 'Global'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Highlights */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">Feature Highlights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Play games without leaving the hub</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Integrated Spotify player</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Real-time chat and messaging</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Live leaderboards and tournaments</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Community events and activities</span>
          </div>
          <div className="flex gap-2">
            <span className="text-primary">✓</span>
            <span>Seamless experience across all modules</span>
          </div>
        </div>
      </div>
    </div>
  );
}
