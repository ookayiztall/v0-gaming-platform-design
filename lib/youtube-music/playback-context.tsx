import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface PlaybackState {
  videoId: string | null;
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

interface PlaybackContextType {
  playbackState: PlaybackState;
  updatePlaybackState: (state: Partial<PlaybackState>) => void;
  play: () => void;
  pause: () => void;
  setCurrentTrack: (videoId: string, title: string, artist: string, thumbnail: string) => void;
}

const PlaybackContext = createContext<PlaybackContextType | null>(null);

const PLAYBACK_STATE_KEY = 'yt-music-playback-state';

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PLAYBACK_STATE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error('[v0] Failed to parse playback state:', error);
        }
      }
    }
    return {
      videoId: null,
      title: '',
      artist: '',
      thumbnail: '',
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    };
  });

  // Save playback state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PLAYBACK_STATE_KEY, JSON.stringify(playbackState));
    }
  }, [playbackState]);

  const updatePlaybackState = useCallback((state: Partial<PlaybackState>) => {
    setPlaybackState(prev => ({ ...prev, ...state }));
  }, []);

  const play = useCallback(() => {
    updatePlaybackState({ isPlaying: true });
  }, [updatePlaybackState]);

  const pause = useCallback(() => {
    updatePlaybackState({ isPlaying: false });
  }, [updatePlaybackState]);

  const setCurrentTrack = useCallback((videoId: string, title: string, artist: string, thumbnail: string) => {
    updatePlaybackState({
      videoId,
      title,
      artist,
      thumbnail,
      currentTime: 0,
      isPlaying: true,
    });
  }, [updatePlaybackState]);

  return (
    <PlaybackContext.Provider value={{
      playbackState,
      updatePlaybackState,
      play,
      pause,
      setCurrentTrack,
    }}>
      {children}
    </PlaybackContext.Provider>
  );
}

export function useYoutubeMusicPlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('useYoutubeMusicPlayback must be used within PlaybackProvider');
  }
  return context;
}
