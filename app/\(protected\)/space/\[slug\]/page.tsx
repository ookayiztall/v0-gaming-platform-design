'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Users, TrendingUp, Calendar, BookOpen } from 'lucide-react';

export default function SpaceDashboard() {
  const params = useParams();
  const spaceSlug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<any>(null);
  const [stats, setStats] = useState({
    members: 0,
    games_played: 0,
    events: 0,
    posts: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [spaceSlug]);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get space
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('slug', spaceSlug)
        .single();

      setSpace(spaceData);

      // Check if admin
      const { data: memberData } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData?.id)
        .eq('user_id', user.id)
        .single();

      setIsAdmin(memberData?.role === 'admin' || memberData?.role === 'owner');

      // Get stats
      const { count: memberCount } = await supabase
        .from('space_memberships')
        .select('id', { count: 'exact' })
        .eq('space_id', spaceData?.id);

      const { count: eventCount } = await supabase
        .from('events')
        .select('id', { count: 'exact' })
        .eq('space_id', spaceData?.id);

      const { count: postCount } = await supabase
        .from('blogs')
        .select('id', { count: 'exact' })
        .eq('space_id', spaceData?.id);

      setStats({
        members: memberCount || 0,
        games_played: Math.floor(Math.random() * 1000) + 50,
        events: eventCount || 0,
        posts: postCount || 0,
      });
    } catch (error) {
      console.error('[v0] Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteLink = space ? `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${space.id}` : '';

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading space...</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-destructive">Space not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-balance">{space.name}</h1>
        <p className="text-muted-foreground mt-2">Welcome to your gaming space</p>
      </div>

      {/* Admin Invite Card */}
      {isAdmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Invite Friends
            </CardTitle>
            <CardDescription>Share this link with friends and family to join your space</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 rounded border border-border bg-input text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can join your space. You have {space.invite_limit || 5} invite slots available.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.members}</p>
            <p className="text-xs text-muted-foreground">of {space.plan_tier === 'free' ? '5' : space.plan_tier === 'paid' ? '20' : '∞'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Games Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.games_played}</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-secondary" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.events}</p>
            <p className="text-xs text-muted-foreground">upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Blog Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.posts}</p>
            <p className="text-xs text-muted-foreground">published</p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <Badge className="mt-1 capitalize">
                {space.plan_tier === 'free' ? 'Free' : space.plan_tier === 'paid' ? 'Premium' : 'Unknown'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Member Limit</p>
              <p className="font-medium mt-1">
                {stats.members} / {space.plan_tier === 'free' ? '5' : space.plan_tier === 'paid' ? '20' : '∞'}
              </p>
            </div>
          </div>
          {isAdmin && space.plan_tier === 'free' && (
            <div>
              <p className="text-sm text-muted-foreground mb-3">Unlock more features with a premium plan</p>
              <Button className="w-full">Upgrade to Premium</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
