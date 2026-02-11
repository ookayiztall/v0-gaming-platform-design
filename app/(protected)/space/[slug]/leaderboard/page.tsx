'use client';

import { useParams } from 'next/navigation';
import { LeaderboardPage } from '@/components/space/leaderboard-page';

export default function SpaceLeaderboardPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;

  return <LeaderboardPage spaceSlug={spaceSlug} />;
}
