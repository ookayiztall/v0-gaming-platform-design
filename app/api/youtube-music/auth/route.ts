import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube-music/callback`;

export async function GET(request: NextRequest) {
  // Validate required environment variables
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('[v0] Missing Google credentials');
    return NextResponse.json(
      { error: 'Google credentials not configured' },
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
  const scope = encodeURIComponent([
    'https://www.googleapis.com/auth/youtube.readonly',
  ].join(' '));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: YOUTUBE_REDIRECT_URI,
    response_type: 'code',
    scope,
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('[v0] YouTube Music auth URL generated:', {
    clientId: GOOGLE_CLIENT_ID.substring(0, 10) + '...',
    redirectUri: YOUTUBE_REDIRECT_URI,
  });

  return NextResponse.json({ url: authUrl, state });
}
