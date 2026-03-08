'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Users } from 'lucide-react';

const games = [
  {
    title: 'Simple Black Jack',
    category: 'Casino',
    players: 45,
    difficulty: 'Easy',
    gradient: 'from-secondary/30 to-primary/30',
  },
  {
    title: 'Chess Masters',
    category: 'Strategy',
    players: 128,
    difficulty: 'Hard',
    gradient: 'from-primary/30 to-secondary/30',
  },
  {
    title: 'Trivia Rush',
    category: 'Trivia',
    players: 256,
    difficulty: 'Medium',
    gradient: 'from-secondary/30 to-primary/30',
  },
  {
    title: 'Puzzle Quest',
    category: 'Puzzle',
    players: 89,
    difficulty: 'Medium',
    gradient: 'from-primary/30 to-secondary/30',
  },
];

const GamesShowcase = () => {
  return (
    <section id="games" className="relative w-full bg-gradient-to-b from-background via-background to-background py-24 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

      <div className="relative z-10 container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-16 flex flex-col items-center justify-between gap-4 md:flex-row"
        >
          <div>
            <h2 className="text-4xl font-bold md:text-5xl mb-2">Popular Games</h2>
            <p className="text-muted-foreground">
              Discover our most played games. From casual card games to competitive trivia.
            </p>
          </div>
          <Link href="/games">
            <Button variant="outline">View All Games</Button>
          </Link>
        </motion.div>

        {/* Games Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {games.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br ${game.gradient} backdrop-blur transition-all hover:border-border/80 hover:shadow-lg hover:shadow-primary/20`}
            >
              {/* Content */}
              <div className="relative z-10 flex h-full flex-col justify-between p-6">
                {/* Top Section */}
                <div>
                  <Button size="sm" className="mb-4 gap-2">
                    <Play className="h-3 w-3" />
                    Play Now
                  </Button>

                  {/* Game info */}
                  <div className="mb-4">
                    <span className="block text-xs text-muted-foreground">{game.category}</span>
                    <h3 className="text-lg font-semibold">{game.title}</h3>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{game.players} playing</span>
                  </div>
                  <div className="text-sm">
                    <span className="inline-block rounded-full bg-background/50 px-3 py-1 text-xs font-medium">
                      {game.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* Emoji decoration */}
              <div className="absolute right-4 bottom-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
                🎮
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GamesShowcase;
