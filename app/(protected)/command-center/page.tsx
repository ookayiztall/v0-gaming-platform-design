'use client';

import { PlaybackProvider } from '@/lib/youtube-music/playback-context';
import { PersistentYouTubePlayer } from '@/components/youtube-music/persistent-player';
import CommandCenterLayout from '@/components/command-center/command-center-layout';

// Public space command center
export default function CommandCenterPage() {
  return (
    <PlaybackProvider>
      <PersistentYouTubePlayer />
      <CommandCenterLayout isPrivateSpace={false} />
    </PlaybackProvider>
  );
}
