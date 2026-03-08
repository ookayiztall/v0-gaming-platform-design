'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';

export default function SpaceMessagesPage() {
  const params = useParams();
  const spaceSlug = params.slug as string;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Direct Messages</h1>
        <p className="text-muted-foreground mt-2">Chat privately in {spaceSlug}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Direct messaging feature coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
