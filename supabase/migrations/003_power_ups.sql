-- Power-ups system migration
-- This adds support for power-ups in the TrivParty game

-- Create power_ups table to define available power-ups
CREATE TABLE power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  max_uses_per_game INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_power_ups table to track power-up ownership and usage
CREATE TABLE player_power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  power_up_id UUID REFERENCES power_ups(id) ON DELETE CASCADE,
  uses_remaining INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, power_up_id)
);

-- Create power_up_usage table to track when power-ups are used
CREATE TABLE power_up_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  power_up_id UUID REFERENCES power_ups(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default power-ups
INSERT INTO power_ups (name, description, icon, max_uses_per_game) VALUES
  ('skip_question', 'Skip a difficult question without penalty', 'SkipForward', 1),
  ('double_points', 'Double points for the next correct answer', 'Zap', 1),
  ('fifty_fifty', 'Remove two incorrect answer options', 'Target', 1);

-- Add indexes for better performance
CREATE INDEX idx_player_power_ups_player_id ON player_power_ups(player_id);
CREATE INDEX idx_power_up_usage_player_id ON power_up_usage(player_id);
CREATE INDEX idx_power_up_usage_question_id ON power_up_usage(question_id);

-- Add RLS policies
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_power_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE power_up_usage ENABLE ROW LEVEL SECURITY;

-- Power-ups are readable by everyone
CREATE POLICY "Power-ups are viewable by everyone" ON power_ups
  FOR SELECT USING (true);

-- Players can view their own power-ups
CREATE POLICY "Players can view their own power-ups" ON player_power_ups
  FOR SELECT USING (true);

-- Players can update their own power-ups
CREATE POLICY "Players can update their own power-ups" ON player_power_ups
  FOR UPDATE USING (true);

-- Power-up usage is viewable by everyone in the same session
CREATE POLICY "Power-up usage is viewable by session members" ON power_up_usage
  FOR SELECT USING (true);

-- Players can insert their own power-up usage
CREATE POLICY "Players can insert their own power-up usage" ON power_up_usage
  FOR INSERT WITH CHECK (true);