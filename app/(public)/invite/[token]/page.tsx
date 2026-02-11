'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface InviteData {
  space_id: string;
  invited_email: string;
  space_name: string;
  space_slug: string;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const supabase = createBrowserClient();

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'processing' | 'success' | 'error'>('loading');
  const [currentUser, setCurrentUser] = useState<{ email: string; id: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateInvite = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Redirect to login with return URL
          router.push(`/login?redirect=/invite/${token}`);
          return;
        }

        setCurrentUser({ email: user.email || '', id: user.id });

        // Fetch invite details
        const { data: invite, error: inviteError } = await supabase
          .from('space_invites')
          .select('*, spaces(id, slug, name)')
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (inviteError || !invite) {
          setStatus('invalid');
          setError('Invite not found or has expired');
          return;
        }

        // Check email match
        if (invite.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
          setStatus('invalid');
          setError(`This invite is for ${invite.invited_email}, but you're logged in as ${user.email}`);
          return;
        }

        // Check expiry
        if (new Date(invite.expires_at) < new Date()) {
          setStatus('invalid');
          setError('This invite has expired');
          return;
        }

        setInviteData({
          space_id: invite.space_id,
          invited_email: invite.invited_email,
          space_name: invite.spaces.name,
          space_slug: invite.spaces.slug,
        });
        setStatus('valid');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    };

    validateInvite();
  }, [token, supabase, router]);

  const handleAcceptInvite = async () => {
    if (!inviteData || !currentUser) return;

    setStatus('processing');
    try {
      // Create membership
      const { error: memberError } = await supabase
        .from('space_memberships')
        .insert({
          space_id: inviteData.space_id,
          user_id: currentUser.id,
          role: 'member',
        });

      if (memberError && !memberError.message.includes('duplicate')) {
        throw memberError;
      }

      // Mark invite as accepted
      await supabase
        .from('space_invites')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('token', token);

      setStatus('success');
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/spaces/${inviteData.space_slug}`);
      }, 2000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Space Invitation</CardTitle>
          <CardDescription>Accept the invitation to join a private space</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Validating invite...</p>
            </div>
          )}

          {status === 'valid' && inviteData && currentUser && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Invited Space</p>
                <p className="text-2xl font-bold">{inviteData.space_name}</p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Your Email</p>
                <p className="font-medium">{currentUser.email}</p>
              </div>

              <Button onClick={handleAcceptInvite} size="lg" className="w-full">
                Accept Invitation
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/spaces')}
                className="w-full"
              >
                Maybe Later
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4 py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <div>
                <p className="font-semibold">Welcome to {inviteData?.space_name}!</p>
                <p className="text-sm text-muted-foreground mt-2">Redirecting you to your space...</p>
              </div>
            </div>
          )}

          {(status === 'invalid' || status === 'error') && (
            <div className="space-y-4 py-8">
              <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>

              <Button variant="outline" onClick={() => router.push('/spaces')} className="w-full">
                Back to Spaces
              </Button>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Accepting invitation...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
