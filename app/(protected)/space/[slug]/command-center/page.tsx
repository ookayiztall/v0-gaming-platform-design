'use client';

import { useParams } from 'next/navigation';
import CommandCenterLayout from '@/components/command-center/command-center-layout';

// Private space command center
export default function SpaceCommandCenterPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;

  return <CommandCenterLayout isPrivateSpace={true} spaceId={spaceSlug} />;
}
