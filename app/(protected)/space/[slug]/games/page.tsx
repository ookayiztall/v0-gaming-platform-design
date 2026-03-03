'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameCard, type GameCardProps } from '@/components/game-card';
import { Search, Filter } from 'lucide-react';

const categories = ['All Games', 'Card Games', 'Casino', 'Trivia', 'Puzzle'];

export default function SpaceGamesPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;
  const [selectedCategory, setSelectedCategory] = useState('All Games');
  const [searchTerm, setSearchTerm] = useState('');
  const [games, setGames] = useState<GameCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        // Fetch games (same catalog for all spaces, but stats are space-scoped)
        const response = await fetch('/api/games');
        if (response.ok) {
          const data = await response.json();
          setGames(
            data.map((game: any) => ({
              id: game.id,
              name: game.title,
              category: game.category,
              players: Math.floor(Math.random() * 100) + 10, // Space members only
              difficulty: game.difficulty,
              thumbnail: '🎮',
              description: game.description,
              isMultiplayer: game.is_multiplayer,
            })),
          );
        }
      } catch (error) {
        console.error('[v0] Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [spaceSlug]);

  const filteredGames = games.filter((game) => {
    const categoryMatch = selectedCategory === 'All Games' || game.category === selectedCategory;
    const searchMatch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold glow-text mb-2">Games in {spaceSlug}</h1>
          <p className="text-muted-foreground">Play together with your space members</p>
        </div>

        {/* Search & Filter */}
        <Card className="mb-8 p-4 bg-card/30 backdrop-blur border-border/50">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search games..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-input border border-border focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat)}
                  className="whitespace-nowrap"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Games Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                id={game.id}
                name={game.name}
                category={game.category}
                players={game.players}
                difficulty={game.difficulty}
                thumbnail={game.thumbnail}
                description={game.description}
                isMultiplayer={game.isMultiplayer}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No games found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
