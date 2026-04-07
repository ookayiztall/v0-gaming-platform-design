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
  const { playbackState, play, pause } = useYoutubeMusicPlayback();

  useEffect(() => {
    setMounted(true);

    // Listen for query params (callback from YouTube auth)
    const params = new URLSearchParams(window.location.search);
    if (params.get('youtube_connected') === 'true') {
      console.log('[v0] YouTube connected via callback');
      setIsConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
      
      // Wait for browser to sync with server before checking playlists
      setTimeout(() => {
        checkConnection();
      }, 500);
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
      setIsConnected(isConnected);
    } catch (error) {
      console.error('[v0] YouTube Music connection check failed:', error);
      setIsConnected(false);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/youtube-music/auth');
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('[v0] YouTube Music login error:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/youtube-music/disconnect', { method: 'POST' });
      setIsConnected(false);
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
          <div>
            <p className="text-sm font-semibold text-foreground truncate">
              {playbackState.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {playbackState.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-border/50 hover:bg-primary/10"
              onClick={() => (playbackState.isPlaying ? pause() : play())}
            >
              {playbackState.isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Play
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-border/50 hover:bg-primary/10"
              onClick={onExpandClick}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Expand
            </Button>
          </div>

          {/* Progress */}
          {playbackState.duration > 0 && (
            <div className="space-y-1">
              <div className="bg-background/50 rounded-full h-1">
                <div
                  className="bg-red-500 h-1 rounded-full transition-all"
                  style={{
                    width: `${(playbackState.currentTime / playbackState.duration) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(playbackState.currentTime)}</span>
                <span>{formatTime(playbackState.duration)}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Select a song to start playing
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-3 border-border/50"
            onClick={onExpandClick}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Open YouTube Music
          </Button>
        </div>
      )}
    </Card>
  );
}

function formatTime(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
