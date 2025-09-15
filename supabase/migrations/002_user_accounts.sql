-- User Account System Migration
-- Adds user authentication, profiles, friends, and statistics

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  total_games_played INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User game history table
CREATE TABLE user_game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  final_score INTEGER NOT NULL,
  final_rank INTEGER NOT NULL,
  questions_answered INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  completion_time INTERVAL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friends system
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_self_friendship CHECK (requester_id != addressee_id),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id)
);

-- User achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_data JSONB,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Private game invitations
CREATE TABLE game_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Update existing tables to support user accounts
-- Add user_id to sessions table for authenticated hosts
ALTER TABLE sessions ADD COLUMN user_id UUID REFERENCES user_profiles(id);

-- Add user_id to players table for authenticated players
ALTER TABLE players ADD COLUMN user_id UUID REFERENCES user_profiles(id);

-- Add user_id to quizzes table for quiz creators
ALTER TABLE quizzes ADD COLUMN created_by UUID REFERENCES user_profiles(id);

-- Indexes for performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_game_history_user_id ON user_game_history(user_id);
CREATE INDEX idx_user_game_history_played_at ON user_game_history(played_at DESC);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_type ON user_achievements(achievement_type);
CREATE INDEX idx_game_invitations_invitee ON game_invitations(invitee_id);
CREATE INDEX idx_game_invitations_status ON game_invitations(status);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);

-- Row Level Security policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Game history policies
CREATE POLICY "Users can view own game history" ON user_game_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert game history" ON user_game_history FOR INSERT WITH CHECK (true);

-- Friendships policies
CREATE POLICY "Users can view friendships they're part of" ON friendships 
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friend requests" ON friendships 
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships they're part of" ON friendships 
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- Game invitations policies
CREATE POLICY "Users can view invitations sent to them or by them" ON game_invitations 
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
CREATE POLICY "Users can create invitations" ON game_invitations 
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users can update invitations sent to them" ON game_invitations 
  FOR UPDATE USING (auth.uid() = invitee_id);

-- Functions for user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile statistics when game history is added
  UPDATE user_profiles 
  SET 
    total_games_played = total_games_played + 1,
    total_correct_answers = total_correct_answers + NEW.correct_answers,
    total_questions_answered = total_questions_answered + NEW.questions_answered,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user stats
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT ON user_game_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Function to calculate user accuracy
CREATE OR REPLACE FUNCTION get_user_accuracy(user_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT 
      CASE 
        WHEN total_questions_answered = 0 THEN 0
        ELSE ROUND((total_correct_answers::DECIMAL / total_questions_answered::DECIMAL) * 100, 2)
      END
    FROM user_profiles 
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user leaderboard position
CREATE OR REPLACE FUNCTION get_user_leaderboard_rank(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT rank FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY total_correct_answers DESC, total_games_played ASC) as rank
      FROM user_profiles
      WHERE total_games_played > 0
    ) ranked_users
    WHERE id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Achievement types enum (stored as text for flexibility)
-- Common achievement types:
-- 'first_game' - Played first game
-- 'perfect_game' - Got all questions correct in a game
-- 'speed_demon' - Answered all questions quickly
-- 'social_butterfly' - Played with 10+ different people
-- 'quiz_master' - Created 5+ quizzes
-- 'streak_master' - Got 10+ questions correct in a row
-- 'comeback_kid' - Won a game after being in last place