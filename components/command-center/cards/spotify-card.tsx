'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Play, Pause } from 'lucide-react';

export default function SpotifyCard() {
  const [isPlaying, setIsPlaying] = useState(false);

  // TODO: Integrate with Spotify API
  // - OAuth 2.0 authentication
  // - Fetch current track data
  // - Real-time playback control

  return (
    <Card className="bg-gradient-to-br from-card/50 to-primary/10 border-primary/20 p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Music className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Now Playing</h3>
      </div>

      {/* Album Art Placeholder */}
      <div className="mb-4 aspect-square bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg border border-primary/20 flex items-center justify-center">
        <Music className="h-12 w-12 text-primary/40" />
      </div>

      {/* Track Info */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-semibold truncate">Midnight Echoes</p>
        <p className="text-xs text-muted-foreground truncate">Artist Name</p>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full border-primary/20 hover:bg-primary/10"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" />
              Play
            </>
          )}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Connect Spotify to see your music
      </p>
    </Card>
  );
}
