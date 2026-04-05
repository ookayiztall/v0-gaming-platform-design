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
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

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

    // Search YouTube
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&videoCategoryId=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('[v0] YouTube search failed:', searchResponse.status, errorText);
      throw new Error(`YouTube search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    return NextResponse.json({
      results: searchData.items || [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Search error:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to search', details: errorMessage },
      { status: 500 }
    );
  }
}
