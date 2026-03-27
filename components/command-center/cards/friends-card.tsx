'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageSquare } from 'lucide-react';

interface Friend {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'in_game';
}

export default function FriendsCard() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchFriends();
    const subscription = supabase
      .channel('friends')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, () => {
        fetchFriends();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('friendships')
        .select('friend_id, profiles:friend_id(username, status)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .limit(8);

      const friendsList = data?.map((f: any) => ({
        id: f.friend_id,
        username: f.profiles?.username || 'Unknown',
        status: f.profiles?.status || 'offline',
      })) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('[v0] Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    online: 'bg-green-500/20 border-green-500/50 text-green-600',
    in_game: 'bg-blue-500/20 border-blue-500/50 text-blue-600',
    offline: 'bg-gray-500/20 border-gray-500/50 text-gray-600',
  };

  return (
    <Card className="bg-card/50 border-primary/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {friends.length} Online
        </h3>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded"></div>
            ))}
          </div>
        ) : friends.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No friends online</p>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-2 rounded hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`h-2 w-2 rounded-full flex-shrink-0 ${statusColors[friend.status].split(' ')[0]}`}></div>
                <span className="text-xs truncate">{friend.username}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs flex-shrink-0 ${statusColors[friend.status]}`}
              >
                {friend.status === 'in_game' ? 'Gaming' : friend.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
