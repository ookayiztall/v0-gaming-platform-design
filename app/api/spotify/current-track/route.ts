import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[v0] No user found in Spotify track endpoint');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[v0] Fetching Spotify integration for user:', user.id);

    // Get Spotify integration
    const { data: integration, error } = await supabase
      .from('spotify_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[v0] Database error fetching Spotify integration:', {
        message: error.message,
        code: error.code,
      });
    }

    if (error || !integration) {
      console.error('[v0] Spotify integration not found for user:', user.id);
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }

    console.log('[v0] Spotify integration found, checking token expiry');

    // Check if token is expired
    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    console.log('[v0] Token expiry check:', { expiresAt: expiresAt.toISOString(), now: now.toISOString(), isExpired: expiresAt < now });
    
    if (expiresAt < now) {
      console.log('[v0] Token expired, refreshing...');
      // Token expired, refresh it
      const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token,
        }).toString(),
      });

      const refreshData = await refreshResponse.json();

      if (!refreshData.access_token) {
        throw new Error('Failed to refresh token');
      }

      // Update token in database
      const expiresAtDate = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
      const { error: updateError } = await supabase
        .from('spotify_integrations')
        .update({
          access_token: refreshData.access_token,
          expires_at: expiresAtDate,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[v0] Error updating Spotify token:', updateError);
        throw updateError;
      }

      integration.access_token = refreshData.access_token;
    }

    // Get currently playing track
    console.log('[v0] Fetching currently playing track...');
    const trackResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
      },
    });

    console.log('[v0] Track response status:', trackResponse.status);

    if (trackResponse.status === 204) {
      const profile = {
        display_name: integration.display_name,
        profile_image_url: integration.profile_image_url,
        spotify_user_id: integration.spotify_user_id,
      };
      return NextResponse.json({ track: null, profile });
    }

    if (!trackResponse.ok) {
      console.error('[v0] Spotify API error:', trackResponse.status, await trackResponse.text());
      throw new Error(`Spotify API error: ${trackResponse.status}`);
    }

    const track = await trackResponse.json();
    const profile = {
      display_name: integration.display_name,
      profile_image_url: integration.profile_image_url,
      spotify_user_id: integration.spotify_user_id,
    };
    return NextResponse.json({ track, profile });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[v0] Spotify track error:', {
      message: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to get current track', details: errorMessage },
      { status: 500 }
    );
  }
}
