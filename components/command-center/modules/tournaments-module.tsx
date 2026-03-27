'use client';

import { Card } from '@/components/ui/card';
import { Swords } from 'lucide-react';

interface TournamentsModuleProps {
  space?: any;
}

export default function TournamentsModule({ space }: TournamentsModuleProps) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Tournaments</h2>
      </div>

      <Card className="p-8 text-center border-border/50">
        <p className="text-muted-foreground">Competitive tournaments coming soon</p>
      </Card>
    </div>
  );
}
