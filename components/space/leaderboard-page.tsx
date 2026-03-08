'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Medal, Flame } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  points: number;
  streak: number;
  rank: number;
  wins?: number;
  level?: number;
}

interface LeaderboardPageProps {
  spaceSlug: string;
}

export function LeaderboardPage({ spaceSlug }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchLeaderboard();
  }, [spaceSlug]);

  const fetchLeaderboard = async () => {
    try {
      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .select('id')
        .eq('slug', spaceSlug)
        .single();

      if (spaceError || !space) {
        console.error('[v0] Space not found:', spaceError);
        setLoading(false);
        return;
      }

      // Fetch user stats scoped to this space, sorted by points
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select(`
          id,
          user_id,
          points,
          level,
          rank,
          total_wins,
          win_streak,
          profiles:user_id(username)
        `)
        .eq('space_id', space.id)
        .order('points', { ascending: false })
        .limit(100);

      if (statsError) {
        console.error('[v0] Error fetching leaderboard:', statsError);
        setLeaderboard([]);
      } else {
        setLeaderboard(
          stats?.map((stat: any, index: number) => ({
            id: stat.id,
            user_id: stat.user_id,
            username: stat.profiles?.username || 'Unknown',
            points: stat.points || 0,
            streak: stat.win_streak || 0,
            rank: index + 1,
            wins: stat.total_wins || 0,
            level: stat.level || 1,
          })) || []
        );
      }
    } catch (error) {
      console.error('[v0] Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">{rank}</span>;
    }
  };

  if (loading) {
    return <div className="p-8">Loading leaderboard...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Space Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Top performers in this space</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-3 rounded hover:bg-accent">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 flex justify-center">
                    {getMedalIcon(entry.rank)}
                  </div>
                  <div>
                    <p className="font-semibold">{entry.username}</p>
                    <p className="text-sm text-muted-foreground">{entry.points} points</p>
                  </div>
                </div>
                {entry.streak > 0 && (
                  <Badge variant="secondary">
                    <Flame className="h-3 w-3 mr-1" />
                    {entry.streak} streak
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
