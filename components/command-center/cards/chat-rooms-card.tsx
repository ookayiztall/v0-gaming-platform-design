'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Zap } from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  member_count: number;
  message_count: number;
}

interface ChatRoomsCardProps {
  spaceId?: string;
  onSelect: (roomId: string) => void;
  isActive: boolean;
}

export default function ChatRoomsCard({ spaceId, onSelect, isActive }: ChatRoomsCardProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchRooms();
    const subscription = supabase
      .channel(`chat-rooms${spaceId ? `-${spaceId}` : ''}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [spaceId]);

  const fetchRooms = async () => {
    try {
      let query = supabase.from('chat_rooms').select('id, name');
      
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      } else {
        query = query.is('space_id', null);
      }

      const { data } = await query.limit(5);
      setRooms(data || []);
    } catch (error) {
      console.error('[v0] Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <Card className="p-4 bg-card/50 border-primary/20 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </Card>
      ) : rooms.length === 0 ? (
        <Card className="p-4 bg-card/50 border-primary/20 text-center text-muted-foreground text-sm">
          No chat rooms available
        </Card>
      ) : (
        rooms.map((room) => (
          <Card
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`p-4 cursor-pointer transition-all border ${
              isActive
                ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/20'
                : 'bg-card/50 border-primary/20 hover:border-primary/40 hover:bg-card/70'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <MessageCircle className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm truncate">{room.name}</h3>
              </div>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>24 users</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
