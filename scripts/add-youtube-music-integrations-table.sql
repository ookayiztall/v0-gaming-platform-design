-- Create youtube_music_integrations table to store user's Google OAuth tokens
CREATE TABLE IF NOT EXISTS youtube_music_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  display_name TEXT,
  profile_image_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for youtube_music_integrations
ALTER TABLE youtube_music_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own YouTube Music integration
CREATE POLICY "Users can view own YouTube Music integration"
  ON youtube_music_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own YouTube Music integration
CREATE POLICY "Users can update own YouTube Music integration"
  ON youtube_music_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own YouTube Music integration
CREATE POLICY "Users can insert own YouTube Music integration"
  ON youtube_music_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own YouTube Music integration
CREATE POLICY "Users can delete own YouTube Music integration"
  ON youtube_music_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_youtube_music_user_id ON youtube_music_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_music_google_user_id ON youtube_music_integrations(google_user_id);
