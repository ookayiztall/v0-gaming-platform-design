'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Copy, X, Mail, Users, Settings, Zap } from 'lucide-react';

interface Space {
  id: string;
  slug: string;
  name: string;
  description: string;
  owner_id: string;
  plan_tier: string;
  invite_limit: number;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles: { username: string; avatar_url: string };
}

interface Invite {
  id: string;
  invited_email: string;
  status: string;
  token: string;
  expires_at: string;
}

export default function SpaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const supabase = createBrowserClient();

  const [space, setSpace] = useState<Space | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setCurrentUserId(user.id);

        // Fetch space
        const { data: spaceData } = await supabase
          .from('spaces')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!spaceData) {
          router.push('/spaces');
          return;
        }

        setSpace(spaceData);

        // Check if user is owner
        if (spaceData.owner_id === user.id) {
          setIsOwner(true);
        }

        // Fetch members
        const { data: membersData } = await supabase
          .from('space_memberships')
          .select('*, profiles(*)')
          .eq('space_id', spaceData.id);

        setMembers(membersData || []);

        // Fetch invites (only if owner)
        if (spaceData.owner_id === user.id) {
          const { data: invitesData } = await supabase
            .from('space_invites')
            .select('*')
            .eq('space_id', spaceData.id)
            .eq('status', 'pending');

          setInvites(invitesData || []);
        }
      } catch (error) {
        console.error('Error fetching space:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, supabase, router]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space || !isOwner) return;

    try {
      const { data, error } = await supabase
        .from('space_invites')
        .insert({
          space_id: space.id,
          invited_email: inviteEmail,
          invited_by: currentUserId,
          token: crypto.getRandomValues(new Uint8Array(32)).toString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setInvites([...invites, data]);
      setInviteEmail('');
      // In production, send email with invite link here
    } catch (error) {
      console.error('Error sending invite:', error);
    }
  };

  const handleRemoveInvite = async (inviteId: string) => {
    try {
      await supabase
        .from('space_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

      setInvites(invites.filter((i) => i.id !== inviteId));
    } catch (error) {
      console.error('Error revoking invite:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!space || !isOwner) return;

    try {
      await supabase
        .from('space_memberships')
        .delete()
        .eq('space_id', space.id)
        .eq('user_id', userId);

      setMembers(members.filter((m) => m.user_id !== userId));
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!space) return null;

  const memberCount = members.length;
  const inviteCount = invites.length;
  const totalInvitations = memberCount + inviteCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" className="mb-8" onClick={() => router.push('/spaces')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Spaces
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">{space.name}</h1>
              <p className="text-muted-foreground mt-2">@{space.slug}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={space.plan_tier === 'paid' ? 'default' : 'secondary'}>
                {space.plan_tier === 'paid' ? (
                  <>
                    <Zap className="w-3 h-3 mr-1" />
                    Premium
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3 mr-1" />
                    Free
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {isOwner && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members & Invites
              </CardTitle>
              <CardDescription>{memberCount} members, {inviteCount} pending invites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 p-3 bg-background rounded-lg">
                <p className="text-sm font-medium mb-2">Invite Limit</p>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(totalInvitations / space.invite_limit) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalInvitations} / {space.invite_limit} slots used
                </p>
              </div>

              {totalInvitations < space.invite_limit && (
                <form onSubmit={handleSendInvite} className="flex gap-2 mb-6">
                  <Input
                    type="email"
                    placeholder="invite@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Send Invite
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="members" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members ({memberCount})</TabsTrigger>
            {isOwner && <TabsTrigger value="invites">Pending ({inviteCount})</TabsTrigger>}
            {isOwner && <TabsTrigger value="settings">Settings</TabsTrigger>}
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                          {member.profiles?.username?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{member.profiles?.username || 'Unknown'}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                      {isOwner && member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwner && (
            <TabsContent value="invites">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {invites.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">No pending invites</p>
                    ) : (
                      invites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{invite.invited_email}</p>
                            <p className="text-xs text-muted-foreground">
                              Expires {new Date(invite.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInvite(invite.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Space Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {space.plan_tier === 'free' && (
                    <Button className="w-full gap-2">
                      <Zap className="w-4 h-4" />
                      Upgrade to Premium - $5/month
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
