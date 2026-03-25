'use client';

import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

interface EventsModuleProps {
  space?: any;
}

export default function EventsModule({ space }: EventsModuleProps) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Events</h2>
      </div>

      <Card className="p-8 text-center border-border/50">
        <p className="text-muted-foreground">Community events coming soon</p>
      </Card>
    </div>
  );
}
