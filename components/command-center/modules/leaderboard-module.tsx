'use client';

import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface LeaderboardModuleProps {
  space?: any;
}

export default function LeaderboardModule({ space }: LeaderboardModuleProps) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
      </div>

      <Card className="p-8 text-center border-border/50">
        <p className="text-muted-foreground">Top performers leaderboard coming soon</p>
      </Card>
    </div>
  );
}
