'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { SpaceContext, type Space } from '@/lib/spaces/context';

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const supabase = createBrowserClient();
  const spaceSlug = params.slug as string | undefined;

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user's spaces
        const { data: memberships } = await supabase
          .from('space_memberships')
          .select('spaces(*)')
          .eq('user_id', user.id);

        const spaces = memberships?.map((m: any) => m.spaces).filter(Boolean) || [];
        setUserSpaces(spaces);

        // Set current space if viewing a specific space
        if (spaceSlug) {
          const space = spaces.find((s: Space) => s.slug === spaceSlug);
          setCurrentSpace(space || null);
        } else {
          setCurrentSpace(null);
        }
      } catch (error) {
        console.error('Error fetching spaces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpaces();
  }, [spaceSlug, supabase]);

  return (
    <SpaceContext.Provider
      value={{
        currentSpace,
        isPublic: !currentSpace,
        setCurrentSpace,
        userSpaces,
        setUserSpaces,
      }}
    >
      {loading ? <div className="p-8 text-center">Loading...</div> : children}
    </SpaceContext.Provider>
  );
}
