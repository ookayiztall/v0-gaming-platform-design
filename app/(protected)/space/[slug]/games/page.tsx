'use client';

import { useParams } from 'next/navigation';
import { GamesPage } from '@/components/space/games-page';

export default function SpaceGamesPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;

  return <GamesPage spaceSlug={spaceSlug} />;
}
