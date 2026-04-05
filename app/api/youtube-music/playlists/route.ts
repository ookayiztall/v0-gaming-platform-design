import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get YouTube Music integration
    const { data: integration, error } = await supabase
      .from('youtube_music_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !integration) {
      return NextResponse.json({ error: 'YouTube Music not connected' }, { status: 404 });
    }

    let accessToken = integration.access_token;

    // Check if token is expired and refresh if needed
    const expiresAt = new Date(integration.expires_at);
    if (expiresAt < new Date() && integration.refresh_token) {
      console.log('[v0] YouTube Music token expired, refreshing...');
      accessToken = await refreshAccessToken(integration.refresh_token);

      // Update token in database
      await supabase
        .from('youtube_music_integrations')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Fetch playlists from YouTube API
    const playlistsResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!playlistsResponse.ok) {
      const errorText = await playlistsResponse.text();
      console.error('[v0] YouTube API error:', playlistsResponse.status, errorText);
      throw new Error(`YouTube API error: ${playlistsResponse.status}`);
    }

    const playlistsData = await playlistsResponse.json();

    return NextResponse.json({
      playlists: playlistsData.items || [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Playlists fetch error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch playlists', details: errorMessage },
      { status: 500 }
    );
  }
}
