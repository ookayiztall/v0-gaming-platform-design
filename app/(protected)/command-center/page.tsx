'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import CommandCenterLayout from '@/components/command-center/command-center-layout';

type ModuleType = 'games' | 'chat' | 'messages' | 'spotify' | 'leaderboard' | 'tournaments' | 'events' | 'welcome';

export default function CommandCenterPage() {
  const [activeModule, setActiveModule] = useState<ModuleType>('welcome');
  const [user, setUser] = useState<any>(null);
  const [space, setSpace] = useState<any>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchUserAndSpace = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        setUser(authUser);

        // Fetch user's primary space (first space they're a member of)
        const { data: memberships } = await supabase
          .from('space_memberships')
          .select('space_id')
          .eq('user_id', authUser.id)
          .limit(1)
          .single();

        if (memberships) {
          const { data: spaceData } = await supabase
            .from('spaces')
            .select('*')
            .eq('id', memberships.space_id)
            .single();

          setSpace(spaceData);
        }
      } catch (error) {
        console.error('[v0] Error fetching user/space:', error);
      }
    };

    fetchUserAndSpace();
  }, []);

  return (
    <CommandCenterLayout 
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      user={user}
      space={space}
    />
  );
}
