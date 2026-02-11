-- Add space_id to existing feature tables for space-scoping

-- Chat messages
ALTER TABLE chat_messages
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_chat_messages_space_id (space_id);

-- Leaderboard entries
ALTER TABLE leaderboard
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_leaderboard_space_id (space_id);

-- Game sessions (if exists)
ALTER TABLE game_sessions
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_game_sessions_space_id (space_id);

-- Tournaments
ALTER TABLE tournaments
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_tournaments_space_id (space_id);

-- Polls
ALTER TABLE polls
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_polls_space_id (space_id);

-- Blog posts (for private spaces)
ALTER TABLE blog_posts
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_blog_posts_space_id (space_id);

-- Activity feed
ALTER TABLE activity_feed
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_activity_feed_space_id (space_id);

-- User reactions
ALTER TABLE reactions
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_reactions_space_id (space_id);

-- Blog comments
ALTER TABLE blog_comments
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_blog_comments_space_id (space_id);

-- Game reviews
ALTER TABLE game_reviews
ADD COLUMN space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
ADD INDEX idx_game_reviews_space_id (space_id);
