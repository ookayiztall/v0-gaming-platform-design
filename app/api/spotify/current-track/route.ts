import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Spotify integration
    const { data: integration, error } = await supabase
      .from('spotify_integrations')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !integration) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 404 });
    }

    // Check if token is expired
    const expiresAt = new Date(integration.expires_at);
    if (expiresAt < new Date()) {
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
    const trackResponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
      },
    });

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
    console.error('[v0] Spotify track error:', error);
    return NextResponse.json({ error: 'Failed to get current track' }, { status: 500 });
  }
}
