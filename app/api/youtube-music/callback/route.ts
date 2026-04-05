import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube-music/callback`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('[v0] YouTube Music callback received:', { hasCode: !!code, hasError: !!error, error });

  if (error) {
    console.error('[v0] Google auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?error=youtube_auth_failed`);
  }

  if (!code) {
    console.error('[v0] No authorization code received from Google');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?error=youtube_auth_failed`);
  }

  try {
    // Validate credentials
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing Google credentials');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: YOUTUBE_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[v0] Google token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('[v0] No access token in response:', tokenData);
      throw new Error('Failed to get access token');
    }

    console.log('[v0] Google token exchanged successfully');

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('[v0] Google profile fetch failed:', profileResponse.status, errorText);
      throw new Error(`Profile fetch failed: ${profileResponse.status}`);
    }

    const profile = await profileResponse.json();
    console.log('[v0] Google profile fetched:', { id: profile.id, email: profile.email });

    // Save to database
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('[v0] Authenticated user:', { userId: user.id });

    // Upsert YouTube Music integration
    const expiresAtDate = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

    const { error: upsertError } = await supabase.from('youtube_music_integrations').upsert(
      {
        user_id: user.id,
        google_user_id: profile.id,
        email: profile.email,
        name: profile.name,
        picture_url: profile.picture,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAtDate,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (upsertError) {
      console.error('[v0] Error saving YouTube Music integration:', {
        message: upsertError.message,
        code: upsertError.code,
      });
      throw upsertError;
    }

    console.log('[v0] YouTube Music integration saved successfully');

    // Redirect back to command center with success indicator
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/command-center?youtube_connected=true`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] YouTube Music callback error:', {
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/command-center?error=youtube_auth_failed`);
  }
}
