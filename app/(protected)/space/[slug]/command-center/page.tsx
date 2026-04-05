'use client';

import { useParams } from 'next/navigation';
import { PlaybackProvider } from '@/lib/youtube-music/playback-context';
import { PersistentYouTubePlayer } from '@/components/youtube-music/persistent-player';
import CommandCenterLayout from '@/components/command-center/command-center-layout';

// Private space command center
export default function SpaceCommandCenterPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;

  return (
    <PlaybackProvider>
      <PersistentYouTubePlayer />
      <CommandCenterLayout isPrivateSpace={true} spaceId={spaceSlug} />
    </PlaybackProvider>
  );
}
