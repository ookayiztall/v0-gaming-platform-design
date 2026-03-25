'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  duration: number;
  isPlaying: boolean;
}

interface SpotifyModuleProps {
  user?: any;
}

export default function SpotifyModule({ user }: SpotifyModuleProps) {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement Spotify OAuth flow and fetch currently playing track
    // This is prepared for real Spotify API integration
    setLoading(false);
    
    // Mock data for now
    // In production, use Spotify Web API:
    // 1. OAuth2 Authorization Code Flow
    // 2. Fetch current playback state
    // 3. Store access token securely
  }, [user?.id]);

  const handleConnect = async () => {
    // TODO: Implement Spotify OAuth connection
    // Redirect to Spotify authorization endpoint
    console.log('[v0] Implement Spotify OAuth connection');
  };

  const handlePlayPause = async () => {
    if (!isConnected) return;
    // TODO: Call Spotify API to play/pause
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = async () => {
    if (!isConnected) return;
    // TODO: Call Spotify API to skip to next track
  };

  const handlePreviousTrack = async () => {
    if (!isConnected) return;
    // TODO: Call Spotify API to go to previous track
  };

  return (
    <div className="p-8 space-y-6 flex flex-col items-center justify-center min-h-96">
      {/* Spotify Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Music className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Spotify</h2>
        <p className="text-muted-foreground mt-2">Stream music while you play</p>
      </div>

      {!isConnected ? (
        <Card className="p-8 max-w-md w-full border-border/50 bg-card/30">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Connect your Spotify account to stream music while you game
            </p>
            <Button
              onClick={handleConnect}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <Music className="h-4 w-4" />
              Connect Spotify
            </Button>
            <p className="text-xs text-muted-foreground">
              We'll never post to your Spotify profile without permission
            </p>
          </div>
        </Card>
      ) : currentTrack ? (
        <Card className="p-8 max-w-md w-full border-border/50 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <div className="space-y-6">
            {/* Album Art */}
            <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              {currentTrack.image ? (
                <img
                  src={currentTrack.image}
                  alt={currentTrack.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="h-20 w-20 text-primary/30" />
              )}
            </div>

            {/* Track Info */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                {currentTrack.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {currentTrack.artist}
              </p>
              <p className="text-xs text-muted-foreground">{currentTrack.album}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-1 rounded-full bg-muted-foreground/20 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{
                    width: isPlaying ? '45%' : '0%',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span>{Math.floor(currentTrack.duration / 60)}:00</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousTrack}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                onClick={handlePlayPause}
                className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center p-0"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-1" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextTrack}
                className="text-muted-foreground hover:text-foreground"
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-8 max-w-md w-full border-border/50 bg-card/30 text-center">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : 'No track currently playing'}
          </p>
        </Card>
      )}

      {/* Integration Notes */}
      <div className="mt-8 max-w-2xl text-xs text-muted-foreground text-center space-y-2 p-4 rounded-lg bg-card/30 border border-border/30">
        <p>
          <strong>Ready for Spotify Integration:</strong> This module is structured to accept:
        </p>
        <ul className="space-y-1 text-left inline-block">
          <li>• OAuth 2.0 Authorization Code Flow</li>
          <li>• Spotify Web API /v1/me/player/currently-playing endpoint</li>
          <li>• Playback control endpoints (play, pause, next, previous)</li>
          <li>• Token refresh mechanism</li>
        </ul>
      </div>
    </div>
  );
}
