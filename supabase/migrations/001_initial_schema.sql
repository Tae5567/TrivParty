-- TrivParty Database Schema
-- Initial migration to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Quiz table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 options
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  question_order INTEGER NOT NULL
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  host_id UUID NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed')),
  current_question_id UUID REFERENCES questions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player answers table
CREATE TABLE player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_questions_order ON questions(quiz_id, question_order);
CREATE INDEX idx_sessions_join_code ON sessions(join_code);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_player_answers_player_id ON player_answers(player_id);
CREATE INDEX idx_player_answers_question_id ON player_answers(question_id);

-- Row Level Security (RLS) policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_answers ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later based on authentication requirements)
-- For now, allow all operations for development
CREATE POLICY "Allow all operations on quizzes" ON quizzes FOR ALL USING (true);
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true);
CREATE POLICY "Allow all operations on sessions" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on player_answers" ON player_answers FOR ALL USING (true);

-- Constraints to ensure data integrity
ALTER TABLE questions ADD CONSTRAINT questions_options_length CHECK (jsonb_array_length(options) = 4);
ALTER TABLE players ADD CONSTRAINT players_score_non_negative CHECK (score >= 0);
ALTER TABLE sessions ADD CONSTRAINT sessions_join_code_format CHECK (length(join_code) >= 4);

-- Unique constraint to prevent duplicate nicknames in the same session
ALTER TABLE players ADD CONSTRAINT unique_nickname_per_session UNIQUE (session_id, nickname);

-- Unique constraint to prevent duplicate answers from the same player for the same question
ALTER TABLE player_answers ADD CONSTRAINT unique_player_question_answer UNIQUE (player_id, question_id);