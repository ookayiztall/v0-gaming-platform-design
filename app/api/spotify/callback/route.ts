import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/callback`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('[v0] Spotify callback received:', { hasCode: !!code, hasError: !!error, error });

  if (error) {
    console.error('[v0] Spotify auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?error=spotify_auth_failed`);
  }

  if (!code) {
    console.error('[v0] No authorization code received from Spotify');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?error=spotify_auth_failed`);
  }

  try {
    // Validate credentials
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Missing Spotify credentials');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[v0] Spotify token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('[v0] No access token in response:', tokenData);
      throw new Error('Failed to get access token');
    }

    // Get user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('[v0] Spotify profile fetch failed:', profileResponse.status, errorText);
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }

    const profile = await profileResponse.json();
    console.log('[v0] Spotify profile fetched:', { id: profile.id, displayName: profile.display_name });

    // Save to database
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('[v0] Authenticated user:', { userId: user.id });

    // Upsert Spotify integration
    const expiresAtDate = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const profileImage = profile.images?.[0]?.url || null;
    
    const { error } = await supabase.from('spotify_integrations').upsert(
      {
        user_id: user.id,
        spotify_user_id: profile.id,
        display_name: profile.display_name,
        profile_image_url: profileImage,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAtDate,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      console.error('[v0] Error saving Spotify integration:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      throw error;
    }

    console.log('[v0] Spotify integration saved successfully');

    // Redirect back to command center
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?spotify_connected=true`);
  } catch (error) {
    console.error('[v0] Spotify callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?error=spotify_auth_failed`);
  }
}
