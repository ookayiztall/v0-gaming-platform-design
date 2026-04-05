'use client';

import { useEffect, useRef } from 'react';
import { useYoutubeMusicPlayback } from '@/lib/youtube-music/playback-context';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function PersistentYouTubePlayer() {
  const playerRef = useRef<any>(null);
  const { playbackState, updatePlaybackState } = useYoutubeMusicPlayback();

  // Initialize YouTube IFrame API
  useEffect(() => {
    // Load YouTube IFrame API script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      // Create player in hidden container
      playerRef.current = new window.YT.Player('yt-music-player-container', {
        height: '0',
        width: '0',
        videoId: playbackState.videoId || '',
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      });
    };

    return () => {
      // Keep player mounted even on unmount
    };
  }, []);

  const onPlayerReady = () => {
    console.log('[v0] YouTube player ready');
    // If playback state indicates playing, start playback
    if (playbackState.isPlaying && playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const onPlayerStateChange = (event: any) => {
    const state = event.data;
    switch (state) {
      case window.YT.PlayerState.PLAYING:
        updatePlaybackState({ isPlaying: true });
        // Update current time every second
        const updateInterval = setInterval(() => {
          if (playerRef.current) {
            updatePlaybackState({
              currentTime: playerRef.current.getCurrentTime(),
              duration: playerRef.current.getDuration(),
            });
          }
        }, 1000);
        return () => clearInterval(updateInterval);
      case window.YT.PlayerState.PAUSED:
        updatePlaybackState({ isPlaying: false });
        break;
      case window.YT.PlayerState.ENDED:
        updatePlaybackState({ isPlaying: false });
        break;
    }
  };

  const onPlayerError = (event: any) => {
    console.error('[v0] YouTube player error:', event.data);
  };

  // Sync playback state with player
  useEffect(() => {
    if (!playerRef.current) return;

    if (playbackState.videoId && playerRef.current.getVideoData()?.video_id !== playbackState.videoId) {
      playerRef.current.loadVideoById(playbackState.videoId);
    }

    if (playbackState.isPlaying && playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
      playerRef.current.playVideo();
    } else if (!playbackState.isPlaying && playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
    }
  }, [playbackState.videoId, playbackState.isPlaying]);

  return (
    <>
      {/* Hidden player container - never unmounts */}
      <div id="yt-music-player-container" style={{ display: 'none' }} />
    </>
  );
}
