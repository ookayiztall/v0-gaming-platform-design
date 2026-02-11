'use client';

import { useParams } from 'next/navigation';
import { ChatPage } from '@/components/space/chat-page';

export default function SpaceChatPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;

  return <ChatPage spaceSlug={spaceSlug} />;
}
