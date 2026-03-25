'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Calendar } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
}

interface TournamentsCardProps {
  spaceId?: string;
  onSelect: (tournamentId: string) => void;
  isActive: boolean;
}

export default function TournamentsCard({ spaceId, onSelect, isActive }: TournamentsCardProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchTournaments();
    const subscription = supabase
      .channel(`tournaments${spaceId ? `-${spaceId}` : ''}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        fetchTournaments();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [spaceId]);

  const fetchTournaments = async () => {
    try {
      let query = supabase.from('tournaments').select('id, name, status, start_date');
      
      if (spaceId) {
        query = query.eq('space_id', spaceId);
      }

      const { data } = await query.order('start_date', { ascending: true }).limit(5);
      setTournaments(data || []);
    } catch (error) {
      console.error('[v0] Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    in_progress: 'bg-green-500/10 border-green-500/30 text-green-500',
    completed: 'bg-gray-500/10 border-gray-500/30 text-gray-500',
  };

  return (
    <div className="space-y-2">
      {loading ? (
        <Card className="p-4 bg-card/50 border-primary/20 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </Card>
      ) : tournaments.length === 0 ? (
        <Card className="p-4 bg-card/50 border-primary/20 text-center text-muted-foreground text-sm">
          No tournaments
        </Card>
      ) : (
        tournaments.map((tournament) => (
          <Card
            key={tournament.id}
            onClick={() => onSelect(tournament.id)}
            className={`p-4 cursor-pointer transition-all border ${
              isActive
                ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/20'
                : 'bg-card/50 border-primary/20 hover:border-primary/40 hover:bg-card/70'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <h3 className="font-semibold text-sm truncate">{tournament.name}</h3>
              </div>
              <Badge 
                className={`text-xs ${statusColors[tournament.status] || 'bg-muted'}`}
              >
                {tournament.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
