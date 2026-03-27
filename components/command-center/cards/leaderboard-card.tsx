'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  points: number;
  rank: number;
}

interface LeaderboardCardProps {
  spaceId?: string;
}

export default function LeaderboardCard({ spaceId }: LeaderboardCardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchLeaderboard();
    const subscription = supabase
      .channel(`leaderboard${spaceId ? `-${spaceId}` : ''}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [spaceId]);

  const fetchLeaderboard = async () => {
    try {
      let query = supabase
        .from('user_stats')
        .select('user_id, points, rank, profiles:user_id(username)')
        .order('points', { ascending: false });
      
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }

      const { data } = await query.limit(5);

      const leaders = data?.map((d: any) => ({
        user_id: d.user_id,
        username: d.profiles?.username || 'Unknown',
        points: d.points,
        rank: d.rank,
      })) || [];

      setLeaderboard(leaders);
    } catch (error) {
      console.error('[v0] Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const medalEmojis: Record<number, string> = {
    1: '🥇',
    2: '🥈',
    3: '🥉',
  };

  return (
    <Card className="bg-card/50 border-primary/20 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-4 w-4 text-yellow-500" />
        <h3 className="font-semibold text-sm">Top Players</h3>
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 bg-muted rounded"></div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No leaderboard data</p>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.user_id}
              className="flex items-center justify-between p-2 rounded hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-yellow-500 w-6">
                  {medalEmojis[index + 1] || `#${index + 1}`}
                </span>
                <span className="text-xs truncate">{entry.username}</span>
              </div>
              <span className="text-xs font-semibold text-primary flex-shrink-0">
                {entry.points.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
