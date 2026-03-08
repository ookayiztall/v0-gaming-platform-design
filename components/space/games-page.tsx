'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

interface GamesPageProps {
  spaceSlug: string;
}

export function GamesPage({ spaceSlug }: GamesPageProps) {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchSpaceGames();
  }, [spaceSlug]);

  const fetchSpaceGames = async () => {
    try {
      // Fetch global game catalog (same for all spaces)
      // Space-specific stats (reviews, high scores) come from other tables filtered by space_id
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[v0] Error fetching games:', error);
        setGames([]);
      } else {
        setGames(data || []);
      }
    } catch (error) {
      console.error('[v0] Error fetching games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading games...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Games Library</h1>
        <p className="text-muted-foreground mt-2">Play with your space members</p>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <Gamepad2 className="h-12 w-12 mx-auto opacity-40 mb-4" />
            <p className="text-muted-foreground">No games available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <Card key={game.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{game.name}</CardTitle>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">
                    <span className="font-semibold">Players:</span> {game.min_players}-{game.max_players}
                  </p>
                  <Button className="w-full">Play Game</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
