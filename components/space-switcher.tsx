'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown } from 'lucide-react';

interface Space {
  id: string;
  slug: string;
  name: string;
  role: string;
}

export function SpaceSwitcher({ currentSpaceSlug }: { currentSpaceSlug?: string }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchUserSpaces();
  }, []);

  const fetchUserSpaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('space_memberships')
        .select('space_id, role, spaces(id, slug, name)')
        .eq('user_id', user.id);

      if (data) {
        setSpaces(
          data.map((membership: any) => ({
            id: membership.spaces.id,
            slug: membership.spaces.slug,
            name: membership.spaces.name,
            role: membership.role,
          }))
        );
      }
    } catch (error) {
      console.error('[v0] Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentSpace = spaces.find(s => s.slug === currentSpaceSlug);
  const isPublicMode = !currentSpaceSlug;
  const displayName = isPublicMode ? 'Public Community' : currentSpace?.name || 'Select Space';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <span className="truncate max-w-xs">{displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Spaces & Community</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Public Community Option */}
        <DropdownMenuItem
          onClick={() => router.push('/dashboard')}
          className={isPublicMode ? 'bg-accent' : ''}
        >
          <div className="flex flex-col gap-1 flex-1">
            <span className="font-medium">Public Community</span>
            <span className="text-xs opacity-60">Global • Everyone</span>
          </div>
        </DropdownMenuItem>

        {spaces.length > 0 && <DropdownMenuSeparator />}

        {/* Private Spaces */}
        {spaces.map(space => (
          <DropdownMenuItem
            key={space.id}
            onClick={() => router.push(`/space/${space.slug}`)}
            className={currentSpaceSlug === space.slug ? 'bg-accent' : ''}
          >
            <div className="flex flex-col gap-1 flex-1">
              <span className="font-medium">{space.name}</span>
              <span className="text-xs opacity-60">{space.role}</span>
            </div>
          </DropdownMenuItem>
        ))}
        
        {spaces.length > 0 && <DropdownMenuSeparator />}
        
        <DropdownMenuItem onClick={() => router.push('/spaces/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Private Space
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
