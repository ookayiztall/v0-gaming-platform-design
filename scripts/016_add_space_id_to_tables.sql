-- Add space_id to chat-related tables
ALTER TABLE chat_channels ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE chat_messages ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE voice_sessions ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;

-- Add space_id to social features
ALTER TABLE friendships ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE direct_messages ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE reactions ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE teams ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE team_members ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;

-- Add space_id to community features
ALTER TABLE tournaments ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE tournament_participants ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE polls ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE poll_options ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE poll_votes ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE user_guides ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE game_reviews ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE blog_posts ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE blog_comments ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;

-- Add space_id to stats/rankings
ALTER TABLE user_stats ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE activities ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;

-- Add space_id to moderation features
ALTER TABLE reports ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE moderation_actions ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE moderation_logs ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE banned_words ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;
ALTER TABLE content_approval_queue ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE DEFAULT NULL;

-- Create indexes for faster space-filtered queries
CREATE INDEX idx_chat_channels_space_id ON chat_channels(space_id);
CREATE INDEX idx_chat_messages_space_id ON chat_messages(space_id);
CREATE INDEX idx_voice_sessions_space_id ON voice_sessions(space_id);
CREATE INDEX idx_user_stats_space_id ON user_stats(space_id);
CREATE INDEX idx_tournaments_space_id ON tournaments(space_id);
CREATE INDEX idx_blog_posts_space_id ON blog_posts(space_id);
CREATE INDEX idx_friendships_space_id ON friendships(space_id);
CREATE INDEX idx_direct_messages_space_id ON direct_messages(space_id);
CREATE INDEX idx_user_achievements_space_id ON user_achievements(space_id) WHERE space_id IS NOT NULL;
CREATE INDEX idx_reports_space_id ON reports(space_id);
CREATE INDEX idx_teams_space_id ON teams(space_id);
CREATE INDEX idx_polls_space_id ON polls(space_id);
CREATE INDEX idx_activities_space_id ON activities(space_id);

-- Update RLS policies to enforce space isolation
-- Chat channels
DROP POLICY IF EXISTS "Anyone can read channels" ON chat_channels;
CREATE POLICY "Users can read channels in their space" ON chat_channels 
  FOR SELECT 
  USING (
    space_id IS NULL OR
    EXISTS (
      SELECT 1 FROM space_memberships 
      WHERE space_memberships.space_id = chat_channels.space_id 
      AND space_memberships.user_id = auth.uid()
    )
  );

-- Chat messages  
DROP POLICY IF EXISTS "Anyone can read messages" ON chat_messages;
CREATE POLICY "Users can read messages in their space" ON chat_messages
  FOR SELECT
  USING (
    space_id IS NULL OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = chat_messages.space_id
      AND space_memberships.user_id = auth.uid()
    )
  );

-- Tournaments
DROP POLICY IF EXISTS "Anyone can view tournaments" ON tournaments;
CREATE POLICY "Users can view tournaments in their space" ON tournaments
  FOR SELECT
  USING (
    space_id IS NULL OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = tournaments.space_id
      AND space_memberships.user_id = auth.uid()
    )
  );

-- User stats
DROP POLICY IF EXISTS "user_stats_select_public" ON user_stats;
CREATE POLICY "Users can view stats in their space" ON user_stats
  FOR SELECT
  USING (
    space_id IS NULL OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = user_stats.space_id
      AND space_memberships.user_id = auth.uid()
    )
  );

-- Blog posts
DROP POLICY IF EXISTS "blog_posts_select_published" ON blog_posts;
CREATE POLICY "Users can view published posts in their space" ON blog_posts
  FOR SELECT
  USING (
    (published = true AND space_id IS NULL) OR
    (space_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = blog_posts.space_id
      AND space_memberships.user_id = auth.uid()
    ))
  );

-- Polls
DROP POLICY IF EXISTS "Anyone can view polls" ON polls;
CREATE POLICY "Users can view polls in their space" ON polls
  FOR SELECT
  USING (
    space_id IS NULL OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = polls.space_id
      AND space_memberships.user_id = auth.uid()
    )
  );

-- User guides
DROP POLICY IF EXISTS "Anyone can view published guides" ON user_guides;
CREATE POLICY "Users can view guides in their space" ON user_guides
  FOR SELECT
  USING (
    (published = true AND space_id IS NULL) OR
    (space_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = user_guides.space_id
      AND space_memberships.user_id = auth.uid()
    ))
  );

-- Game reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON game_reviews;
CREATE POLICY "Users can view reviews in their space" ON game_reviews
  FOR SELECT
  USING (
    space_id IS NULL OR
    EXISTS (
      SELECT 1 FROM space_memberships
      WHERE space_memberships.space_id = game_reviews.space_id
      AND space_memberships.user_id = auth.uid()
    )
  );
