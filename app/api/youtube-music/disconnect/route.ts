import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete YouTube Music integration
    const { error } = await supabase
      .from('youtube_music_integrations')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    console.log('[v0] YouTube Music integration disconnected for user:', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Disconnect error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to disconnect', details: errorMessage },
      { status: 500 }
    );
  }
}
