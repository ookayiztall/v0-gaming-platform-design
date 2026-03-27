'use client';

import { Card } from '@/components/ui/card';
import { Mail } from 'lucide-react';

interface MessagesModuleProps {
  user?: any;
}

export default function MessagesModule({ user }: MessagesModuleProps) {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Direct Messages</h2>
      </div>

      <Card className="p-8 text-center border-border/50">
        <p className="text-muted-foreground">Direct messaging feature coming soon</p>
      </Card>
    </div>
  );
}
