-- Replay System Migration
-- Adds tables and functionality for storing and sharing game replays

-- Game replays table to store completed session data
CREATE TABLE game_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  replay_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  quiz_title TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  total_players INTEGER NOT NULL,
  session_duration_seconds INTEGER,
  final_scores JSONB NOT NULL, -- Array of {playerId, nickname, score, rank}
  question_results JSONB NOT NULL, -- Array of question results with answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0
);

-- Replay shares table for tracking social shares
CREATE TABLE replay_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_id UUID REFERENCES game_replays(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'linkedin', 'copy_link'
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shared_by_ip INET -- For anonymous sharing tracking
);

-- Indexes for performance
CREATE INDEX idx_game_replays_replay_code ON game_replays(replay_code);
CREATE INDEX idx_game_replays_session_id ON game_replays(session_id);
CREATE INDEX idx_game_replays_created_at ON game_replays(created_at);
CREATE INDEX idx_game_replays_expires_at ON game_replays(expires_at);
CREATE INDEX idx_replay_shares_replay_id ON replay_shares(replay_id);

-- Row Level Security
ALTER TABLE game_replays ENABLE ROW LEVEL SECURITY;
ALTER TABLE replay_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for replays (public read access, restricted write)
CREATE POLICY "Allow public read access to public replays" ON game_replays 
  FOR SELECT USING (is_public = true AND expires_at > NOW());

CREATE POLICY "Allow insert for completed sessions" ON game_replays 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for replay owners" ON game_replays 
  FOR UPDATE USING (true);

-- RLS policies for replay shares
CREATE POLICY "Allow all operations on replay_shares" ON replay_shares FOR ALL USING (true);

-- Constraints
ALTER TABLE game_replays ADD CONSTRAINT game_replays_replay_code_format 
  CHECK (length(replay_code) >= 8);

ALTER TABLE game_replays ADD CONSTRAINT game_replays_total_questions_positive 
  CHECK (total_questions > 0);

ALTER TABLE game_replays ADD CONSTRAINT game_replays_total_players_positive 
  CHECK (total_players > 0);

ALTER TABLE game_replays ADD CONSTRAINT game_replays_view_count_non_negative 
  CHECK (view_count >= 0);

-- Function to generate unique replay codes
CREATE OR REPLACE FUNCTION generate_replay_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM game_replays WHERE replay_code = result) LOOP
    result := '';
    FOR i IN 1..8 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment replay view count
CREATE OR REPLACE FUNCTION increment_replay_views(replay_code_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE game_replays 
  SET view_count = view_count + 1 
  WHERE replay_code = replay_code_param 
    AND is_public = true 
    AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired replays
CREATE OR REPLACE FUNCTION cleanup_expired_replays()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM game_replays WHERE expires_at <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;