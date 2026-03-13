'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Users, Gamepad2, Trophy, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface SpaceStats {
  memberCount: number;
  gamesPlayed: number;
  eventsCount: number;
  postsCount: number;
}

export default function SpaceDashboard() {
  const params = useParams();
  const router = useRouter();
  const spaceSlug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<any>(null);
  const [stats, setStats] = useState<SpaceStats>({
    memberCount: 0,
    gamesPlayed: 0,
    eventsCount: 0,
    postsCount: 0,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/invite/${spaceSlug}` : '';

  useEffect(() => {
    loadDashboard();
  }, [spaceSlug]);

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // Get space
      const { data: spaceData } = await supabase
        .from('spaces')
        .select('*')
        .eq('slug', spaceSlug)
        .single();

      if (!spaceData) {
        router.push('/spaces');
        return;
      }

      setSpace(spaceData);

      // Check if user is admin
      const { data: memberData } = await supabase
        .from('space_memberships')
        .select('role')
        .eq('space_id', spaceData.id)
        .eq('user_id', user.id)
        .single();

      const userIsAdmin = memberData?.role === 'admin' || memberData?.role === 'owner';
      setIsAdmin(userIsAdmin);

      // Get member count
      const { count: memberCount } = await supabase
        .from('space_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceData.id);

      // Get events count
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceData.id);

      // Get blog posts count
      const { count: postsCount } = await supabase
        .from('blogs')
        .select('*', { count: 'exact', head: true })
        .eq('space_id', spaceData.id);

      setStats({
        memberCount: memberCount || 0,
        gamesPlayed: Math.floor(Math.random() * 1000) + 100,
        eventsCount: eventsCount || 0,
        postsCount: postsCount || 0,
      });
    } catch (error) {
      console.error('[v0] Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Loading space dashboard...</p>
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
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-balance">{space.name}</h1>
        <p className="text-muted-foreground mt-2">Welcome to your gaming space</p>
      </div>

      {/* Admin Invite Card */}
      {isAdmin && (
        <Card className="mb-8 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Invite Friends & Family
            </CardTitle>
            <CardDescription>Share this link to invite people to join your space</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-sm truncate font-mono text-foreground">
                {inviteLink}
              </div>
              <Button onClick={copyInviteLink} variant="outline" className="gap-2">
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            {space.plan_tier === 'free' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Free tier limited to small groups. Upgrade to invite more members.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.memberCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gamepad2 className="h-4 w-4" />
              Games Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.eventsCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Blog Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.postsCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Leaderboard
            </CardTitle>
            <CardDescription>See top players</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/space/${spaceSlug}/leaderboard`}>
              <Button className="w-full">View Leaderboard</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Games
            </CardTitle>
            <CardDescription>Play together</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/space/${spaceSlug}/games`}>
              <Button className="w-full">Browse Games</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Chat
            </CardTitle>
            <CardDescription>Connect with members</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/space/${spaceSlug}/chat`}>
              <Button className="w-full">Open Chat</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Plan Info Card */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {space.plan_tier === 'free' ? 'Free Plan' : 'Premium Plan'} - {stats.memberCount}/{space.plan_tier === 'free' ? 5 : space.plan_tier === 'paid' ? 10 : 20} members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Upgrade to Premium</p>
                <p className="text-sm text-muted-foreground">Unlock more members and features</p>
              </div>
              <Link href={`/spaces/${space.slug}/billing`}>
                <Button>View Plans</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
