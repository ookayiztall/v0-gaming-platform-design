'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Users, Play } from 'lucide-react';

interface Game {
  id: string;
  title: string;
  active_players?: number;
}

interface GamesCardProps {
  spaceId?: string;
  onSelectGame: (gameId: string) => void;
  isActive: boolean;
}

export default function GamesCard({ spaceId, onSelectGame, isActive }: GamesCardProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchGames();
    const subscription = supabase
      .channel(`games${spaceId ? `-${spaceId}` : ''}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        fetchGames();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [spaceId]);

  const fetchGames = async () => {
    try {
      const { data } = await supabase
        .from('games')
        .select('id, title')
        .limit(5);
      
      setGames(data || []);
    } catch (error) {
      console.error('[v0] Error fetching games:', error);
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
      ) : games.length === 0 ? (
        <Card className="p-4 bg-card/50 border-primary/20 text-center text-muted-foreground text-sm">
          No games available
        </Card>
      ) : (
        games.map((game) => (
          <Card
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            className={`p-4 cursor-pointer transition-all border ${
              isActive
                ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/20'
                : 'bg-card/50 border-primary/20 hover:border-primary/40 hover:bg-card/70'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <Gamepad2 className="h-4 w-4 text-accent" />
                <h3 className="font-semibold text-sm truncate">{game.title}</h3>
              </div>
              <Badge variant="outline" className="text-xs bg-accent/10 border-accent/30">
                <Play className="h-3 w-3 mr-1" />
                Play
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>Select to play</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
