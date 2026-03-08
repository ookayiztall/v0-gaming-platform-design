'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { SpaceSwitcher } from '@/components/space-switcher';
import { MainNav } from '@/components/main-nav';

interface Space {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const verifySpaceAccess = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('[v0] Auth error:', authError);
          router.push('/login');
          return;
        }

        // Get space by slug
        const { data: spaceData, error: spaceError } = await supabase
          .from('spaces')
          .select('id, name, slug, owner_id')
          .eq('slug', slug)
          .single();

        if (spaceError || !spaceData) {
          console.error('[v0] Space not found:', spaceError);
          setError('Space not found');
          router.push('/spaces');
          return;
        }

        // Verify user has access to this space
        const { data: membership, error: memberError } = await supabase
          .from('space_memberships')
          .select('role')
          .eq('user_id', user.id)
          .eq('space_id', spaceData.id)
          .single();

        if (memberError || !membership) {
          console.error('[v0] Not a member of space:', memberError);
          setError('You do not have access to this space');
          router.push('/spaces');
          return;
        }

        setSpace(spaceData as Space);
      } catch (error) {
        console.error('[v0] Error verifying space access:', error);
        setError('Failed to verify access');
        router.push('/spaces');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      verifySpaceAccess();
    }
  }, [slug, router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-foreground">Loading space...</p>
        </div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-red-500">{error || 'Space not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card/30 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-6">
          <SpaceSwitcher currentSpaceSlug={slug} />
          <div className="flex-1" />
          <MainNav spaceSlug={slug} />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
