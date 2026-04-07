'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, LogOut, Loader, Maximize2, RotateCw } from 'lucide-react';
import { useYoutubeMusicPlayback } from '@/lib/youtube-music/playback-context';

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface YouTubeMusicCardProps {
  onExpandClick: () => void;
}

export default function YouTubeMusicCard({ onExpandClick }: YouTubeMusicCardProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { playbackState } = useYoutubeMusicPlayback();

  useEffect(() => {
    setMounted(true);

    // Listen for query params (callback from YouTube auth)
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      console.log('[v0] YouTube connected via callback, waiting for session to sync...');
      setIsConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
      
      // Wait a bit longer for database to sync
      setTimeout(() => {
        console.log('[v0] Checking connection after OAuth callback');
        checkConnection();
      }, 1000);
      return;
    }

    // Check if user has YouTube connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      console.log('[v0] Checking YouTube Music connection...');
      const response = await fetch('/api/youtube-music/playlists');
      const isConnected = response.ok;
      console.log('[v0] YouTube Music connection check:', { status: response.status, isConnected });
      
      if (response.ok) {
        console.log('[v0] YouTube Music is connected!');
        setIsConnected(true);
      } else {
        console.log('[v0] YouTube Music is not connected (status:', response.status, ')');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('[v0] YouTube Music connection check failed:', error);
      setIsConnected(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('[v0] Initiating YouTube Music login...');
      const response = await fetch('/api/youtube-music/auth');
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[v0] Auth endpoint error:', error);
        setIsLoading(false);
        return;
      }
      
      const { url } = await response.json();
      console.log('[v0] Redirecting to Google OAuth:', url);
      window.location.href = url;
    } catch (error) {
      console.error('[v0] YouTube Music login error:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('[v0] Disconnecting YouTube Music...');
      await fetch('/api/youtube-music/disconnect', { method: 'POST' });
      setIsConnected(false);
      console.log('[v0] YouTube Music disconnected');
    } catch (error) {
      console.error('[v0] YouTube Music logout error:', error);
    }
  };

  if (!mounted) return null;

  return (
    <Card className="p-4 border-border/50 bg-card/50 backdrop-blur space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-foreground">YouTube Music</h3>
        </div>
        {isConnected && (
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Disconnect YouTube Music"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center py-4">
            Connect your Google account to listen to YouTube Music
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect YouTube'
              )}
            </Button>
            <Button
              onClick={checkConnection}
              size="sm"
              variant="outline"
              className="border-border/50"
              title="Refresh connection status"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : playbackState.videoId ? (
        <div className="space-y-3">
          {/* Album thumbnail */}
          {playbackState.thumbnail && (
            <img
              src={playbackState.thumbnail}
              alt={playbackState.title}
              className="w-full rounded-lg aspect-square object-cover"
            />
          )}

          {/* Track info */}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground truncate">{playbackState.title}</p>
            <p className="text-xs text-muted-foreground truncate">{playbackState.artist}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width: `${playbackState.duration ? (playbackState.currentTime / playbackState.duration) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(playbackState.currentTime)}</span>
              <span>{formatTime(playbackState.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                // Playback controls would be implemented here
              }}
              size="sm"
              variant="ghost"
              className="flex-1"
            >
              {playbackState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              onClick={onExpandClick}
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Expand
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center py-4">
            No track currently playing
          </p>
          <Button
            onClick={onExpandClick}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Open YouTube Music
          </Button>
        </div>
      )}
    </Card>
  );
}
