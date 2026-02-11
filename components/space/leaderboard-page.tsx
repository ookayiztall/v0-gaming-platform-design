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
}

interface LeaderboardPageProps {
  spaceSlug: string;
}

export function LeaderboardPage({ spaceSlug }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchLeaderboard();
  }, [spaceSlug, timeframe]);

  const fetchLeaderboard = async () => {
    try {
      const { data: space } = await supabase
        .from('spaces')
        .select('id')
        .eq('slug', spaceSlug)
        .single();

      if (space) {
        const { data } = await supabase
          .from('leaderboard_entries')
          .select('*, user:profiles(username)')
          .eq('space_id', space.id)
          .eq('timeframe', timeframe)
          .order('rank', { ascending: true });

        setLeaderboard(data || []);
      }
    } catch (error) {
      console.error('[v0] Error fetching leaderboard:', error);
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
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <div className="flex gap-2 mt-4">
          {(['weekly', 'monthly', 'all'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded ${
                timeframe === tf ? 'bg-primary text-white' : 'bg-background border'
              }`}
            >
              {tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>
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
