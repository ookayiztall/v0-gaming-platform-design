'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Plus, Edit2, Trash2, ArrowLeft, Calendar, Users, Medal } from 'lucide-react';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  description: string;
  game_id: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: string;
  prize_description: string;
  created_at: string;
  game: {
    title: string;
  };
  participant_count: number;
}

export default function SpaceTournamentsPage() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<any>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    fetchData();
  }, [spaceSlug]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Get space
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('slug', spaceSlug)
        .single();

      setSpace(spaceData);

      // Check if user is admin
      const { data: memberData } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData?.id)
        .eq('user_id', user.id)
        .single();

      setIsAdmin(memberData?.role === 'admin' || memberData?.role === 'owner');

      // Fetch tournaments for this space
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select(`
          *,
          game:games(title)
        `)
        .eq('space_id', spaceData?.id)
        .order('start_date', { ascending: true });

      // Get participant counts
      if (tournamentsData) {
        const tournamentsWithCounts = await Promise.all(
          tournamentsData.map(async (tournament: any) => {
            const { count } = await supabase
              .from('tournament_participants')
              .select('*', { count: 'exact', head: true })
              .eq('tournament_id', tournament.id);

            return {
              ...tournament,
              participant_count: count || 0,
            };
          })
        );
        setTournaments(tournamentsWithCounts);
      }
    } catch (error) {
      console.error('[v0] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;

    try {
      // Delete tournament participants first
      await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId);

      // Delete tournament
      await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);

      fetchData();
    } catch (error) {
      console.error('[v0] Error deleting tournament:', error);
      alert('Failed to delete tournament');
    }
  };

  const statusColors = {
    upcoming: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    in_progress: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Tournaments</h1>
          <p className="text-muted-foreground mt-2">Compete with your space members in {spaceSlug}</p>
        </div>
        {isAdmin && space && (
          <Button 
            onClick={() => router.push(`/space/${spaceSlug}/tournaments/create`)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Tournament
          </Button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {isAdmin 
                ? 'No tournaments yet. Create one to get started!' 
                : 'No tournaments in this space yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <CardTitle>{tournament.name}</CardTitle>
                    </div>
                    <CardDescription>{tournament.description}</CardDescription>
                  </div>
                  <Badge className={statusColors[tournament.status as keyof typeof statusColors]}>
                    {tournament.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(tournament.start_date).toLocaleDateString()} -{' '}
                      {new Date(tournament.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {tournament.participant_count}
                      {tournament.max_participants ? `/${tournament.max_participants}` : ''} participants
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-muted-foreground" />
                    <span>{tournament.game.title}</span>
                  </div>
                </div>

                {tournament.prize_description && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm">
                      <strong>Prize:</strong> {tournament.prize_description}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link href={`/tournaments/${tournament.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  {isAdmin && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => router.push(`/space/${spaceSlug}/tournaments/${tournament.id}/edit`)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteTournament(tournament.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
