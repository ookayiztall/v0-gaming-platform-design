'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Lock, Users, Zap } from 'lucide-react';

interface Space {
  id: string;
  slug: string;
  name: string;
  description: string;
  plan_tier: string;
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('space_memberships')
          .select('spaces(*)')
          .eq('user_id', user.id);

        if (data) {
          setSpaces(data.map((m: any) => m.spaces).filter(Boolean));
        }
      } catch (error) {
        console.error('Error fetching spaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Your Spaces</h1>
            <p className="text-muted-foreground mt-2">Manage and switch between your private spaces</p>
          </div>
          <Link href="/spaces/create">
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Space
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <Link key={space.id} href={`/spaces/${space.slug}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{space.name}</CardTitle>
                      <CardDescription className="mt-1">@{space.slug}</CardDescription>
                    </div>
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{space.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {space.plan_tier === 'paid' ? (
                      <>
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>Premium</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Free (5 members)</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {spaces.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardHeader>
              <CardTitle>No Spaces Yet</CardTitle>
              <CardDescription>Create your first private space to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/spaces/create">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Space
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
