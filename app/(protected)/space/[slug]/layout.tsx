'use client';

import React from "react"

import { useEffect, useState } from 'react';
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
  const supabase = createBrowserClient();

  useEffect(() => {
    const verifySpaceAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Verify user has access to this space
        const { data: membership } = await supabase
          .from('space_memberships')
          .select('*, spaces(id, name, slug, owner_id)')
          .eq('user_id', user.id)
          .eq('spaces.slug', slug)
          .single();

        if (!membership) {
          router.push('/spaces');
          return;
        }

        setSpace(membership.spaces);
      } catch (error) {
        console.error('[v0] Error verifying space access:', error);
        router.push('/spaces');
      } finally {
        setLoading(false);
      }
    };

    verifySpaceAccess();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Loading space...</p>
        </div>
      </div>
    );
  }

  if (!space) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border/40">
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
