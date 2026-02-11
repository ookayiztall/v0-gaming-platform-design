'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { ChatSidebar } from '@/components/chat-sidebar';
import { Card } from '@/components/ui/card';

interface ChatPageProps {
  spaceSlug: string;
}

export function ChatPage({ spaceSlug }: ChatPageProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>('general');
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchChannels();
    subscribeToMessages();
  }, [spaceSlug]);

  const fetchChannels = async () => {
    try {
      const { data: space } = await supabase
        .from('spaces')
        .select('id')
        .eq('slug', spaceSlug)
        .single();

      if (space) {
        const { data } = await supabase
          .from('chat_channels')
          .select('*')
          .eq('space_id', space.id)
          .order('created_at', { ascending: true });

        setChannels(data || []);
      }
    } catch (error) {
      console.error('[v0] Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`space:${spaceSlug}:messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        payload => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return <div className="p-8">Loading chat...</div>;
  }

  return (
    <div className="flex h-screen gap-4 p-4">
      <ChatSidebar
        channels={channels}
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        spaceSlug={spaceSlug}
      />
      <Card className="flex-1 p-6">
        <h2 className="text-2xl font-bold mb-4">#{selectedChannel}</h2>
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className="p-3 rounded bg-background/50">
              <p className="font-semibold text-sm">{msg.user_id}</p>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
