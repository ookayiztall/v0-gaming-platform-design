import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete Spotify integration
    const { error } = await supabase
      .from('spotify_integrations')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('[v0] Error deleting Spotify integration:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Spotify disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Spotify' },
      { status: 500 }
    );
  }
}
