'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause, LogOut, Loader } from 'lucide-react';
import useSWR from 'swr';

interface Track {
  item: {
    name: string;
    artists: Array<{ name: string }>;
    album: {
      images: Array<{ url: string }>;
      name: string;
    };
    external_urls: { spotify: string };
  };
  is_playing: boolean;
}

interface SpotifyProfile {
  display_name: string;
  external_urls: { spotify: string };
  images: Array<{ url: string }>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SpotifyCard() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { data, error, isLoading: isDataLoading } = useSWR(
    mounted && isConnected ? '/api/spotify/current-track' : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    setMounted(true);
    
    // Check for callback from Spotify auth first
    const params = new URLSearchParams(window.location.search);
    if (params.get('spotify_connected') === 'true') {
      setIsConnected(true);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    // Check if user has Spotify connected
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/spotify/current-track');
        if (response.ok) {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        console.error('[v0] Spotify connection check failed:', err);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const handleSpotifyLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/spotify/auth');
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('[v0] Spotify login error:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/spotify/disconnect', { method: 'POST' });
      if (response.ok) {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('[v0] Spotify logout error:', error);
    }
  };

  if (!mounted) return null;

  const track: Track = data?.track;
  const profile: SpotifyProfile = data?.profile;

  return (
    <Card className="p-4 border-border/50 bg-card/50 backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Music className="h-5 w-5 text-[#1DB954]" />
          <h3 className="font-semibold text-foreground">Spotify</h3>
        </div>
        {isConnected && (
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Disconnect Spotify"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground text-center py-4">
            Connect your Spotify account to see what you're listening to
          </p>
          <Button
            onClick={handleSpotifyLogin}
            disabled={isLoading}
            className="w-full bg-[#1DB954] hover:bg-[#1DB954]/90 text-white text-sm font-semibold"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Spotify'
            )}
          </Button>
        </div>
      ) : isDataLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader className="h-5 w-5 text-primary animate-spin" />
        </div>
      ) : track?.item ? (
        <div className="space-y-3">
          {track.item.album.images[0] && (
            <img
              src={track.item.album.images[0].url}
              alt={track.item.album.name}
              className="w-full rounded-lg aspect-square object-cover"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground truncate">
              {track.item.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {track.item.artists.map((a) => a.name).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {track.is_playing ? (
              <Pause className="h-4 w-4 text-[#1DB954]" />
            ) : (
              <Play className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {track.is_playing ? 'Now Playing' : 'Paused'}
            </span>
          </div>
          <a
            href={track.item.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-[#1DB954] hover:text-[#1DB954]/80 underline text-center py-2"
          >
            Open in Spotify
          </a>
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">
            {profile?.display_name ? `${profile.display_name}, start playing a song` : 'Nothing playing right now'}
          </p>
        </div>
      )}
    </Card>
  );
}
