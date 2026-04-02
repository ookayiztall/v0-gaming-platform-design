import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`;

export async function GET(request: NextRequest) {
  // Validate required environment variables
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('[v0] Missing Spotify credentials:', {
      hasClientId: !!SPOTIFY_CLIENT_ID,
      hasClientSecret: !!SPOTIFY_CLIENT_SECRET,
    });
    return NextResponse.json(
      { error: 'Spotify credentials not configured' },
      { status: 500 }
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('[v0] Missing NEXT_PUBLIC_APP_URL');
    return NextResponse.json(
      { error: 'App URL not configured' },
      { status: 500 }
    );
  }

  const state = Math.random().toString(36).substring(7);
  const scope = 'user-read-private user-read-email user-read-currently-playing';

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state,
    scope,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  console.log('[v0] Spotify auth URL generated:', {
    clientId: SPOTIFY_CLIENT_ID.substring(0, 10) + '...',
    redirectUri: SPOTIFY_REDIRECT_URI,
  });

  return NextResponse.json({ url: authUrl, state });
}
