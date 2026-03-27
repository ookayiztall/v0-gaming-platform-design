'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GamepadIcon, Play } from 'lucide-react';
import Link from 'next/link';

interface Game {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string;
  description: string;
  is_multiplayer: boolean;
  difficulty: string;
}

interface GamesModuleProps {
  space?: any;
}

export default function GamesModule({ space }: GamesModuleProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data } = await supabase
          .from('games')
          .select('*')
          .limit(6);

        setGames(data || []);
      } catch (error) {
        console.error('[v0] Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <GamepadIcon className="h-6 w-6 text-primary" />
          Games
        </h2>
        <p className="text-muted-foreground">Play your favorite games instantly from here</p>
      </div>

      {games.length === 0 ? (
        <Card className="p-8 text-center border-border/50">
          <p className="text-muted-foreground">No games available at the moment</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map((game) => (
            <Card
              key={game.id}
              className="overflow-hidden border-border/50 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all cursor-pointer group"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                {game.thumbnail_url ? (
                  <img
                    src={game.thumbnail_url}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GamepadIcon className="h-12 w-12 text-primary/30" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1">{game.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{game.category}</p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">{game.description}</p>

                <div className="flex gap-2 text-xs">
                  {game.is_multiplayer && (
                    <span className="px-2 py-1 rounded-full bg-primary/20 text-primary">
                      Multiplayer
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full bg-accent/20 text-accent capitalize">
                    {game.difficulty}
                  </span>
                </div>

                <Link href={`/games/${game.id}`} className="block">
                  <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                    <Play className="h-4 w-4" />
                    Play
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
