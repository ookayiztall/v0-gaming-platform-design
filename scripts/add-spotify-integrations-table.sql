-- Create spotify_integrations table to store user Spotify credentials and session data
CREATE TABLE IF NOT EXISTS spotify_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  spotify_user_id TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, space_id)
);

-- Create RLS policies
ALTER TABLE spotify_integrations ENABLE ROW LEVEL SECURITY;

-- Users can view their own Spotify integrations
CREATE POLICY "Users can view their own Spotify integrations" ON spotify_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own Spotify integrations
CREATE POLICY "Users can insert their own Spotify integrations" ON spotify_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own Spotify integrations
CREATE POLICY "Users can update their own Spotify integrations" ON spotify_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own Spotify integrations
CREATE POLICY "Users can delete their own Spotify integrations" ON spotify_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_spotify_integrations_user_id ON spotify_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_spotify_integrations_space_id ON spotify_integrations(space_id);
