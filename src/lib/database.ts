import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
import type { Quiz, Question, Session, Player, PlayerAnswer } from '@/types'

// Quiz operations
export const createQuiz = async (sourceUrl: string, title: string, createdBy?: string): Promise<Quiz> => {
  const { data, error } = await supabase
    .from('quizzes')
    .insert({ 
      source_url: sourceUrl, 
      title,
      created_by: createdBy || null
    })
    .select()
    .single()

  if (error) throw error
  
  return {
    id: data.id,
    sourceUrl: data.source_url,
    title: data.title,
    createdAt: data.created_at,
    questions: []
  }
}

export const getQuizById = async (id: string): Promise<Quiz | null> => {
  const { data, error } = await supabase
    .from('quizzes')
    .select(`
      *,
      questions (*)
    `)
    .eq('id', id)
    .single()

  if (error) return null

  return {
    id: data.id,
    sourceUrl: data.source_url,
    title: data.title,
    createdAt: data.created_at,
    questions: (data.questions as Array<{
      id: string;
      quiz_id: string;
      text: string;
      options: unknown;
      correct_answer: string;
      explanation: string;
      question_order: number;
    }>).map((q) => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.text,
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      questionOrder: q.question_order
    }))
  }
}

// Question operations
export const createQuestions = async (quizId: string, questions: Omit<Question, 'id' | 'quizId'>[]): Promise<Question[]> => {
  const questionsToInsert = questions.map((q, index) => ({
    quiz_id: quizId,
    text: q.text,
    options: q.options,
    correct_answer: q.correctAnswer,
    explanation: q.explanation,
    question_order: q.questionOrder || index + 1
  }))

  const { data, error } = await supabase
    .from('questions')
    .insert(questionsToInsert)
    .select()

  if (error) throw error

  return data.map(q => ({
    id: q.id,
    quizId: q.quiz_id,
    text: q.text,
    options: q.options as string[],
    correctAnswer: q.correct_answer,
    explanation: q.explanation,
    questionOrder: q.question_order
  }))
}

// Session operations
export const createSession = async (quizId: string, hostId: string, userId?: string | null): Promise<Session> => {
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      quiz_id: quizId,
      host_id: hostId,
      join_code: joinCode,
      status: 'waiting',
      user_id: userId || null
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    quizId: data.quiz_id,
    hostId: data.host_id,
    joinCode: data.join_code,
    status: data.status as 'waiting' | 'active' | 'completed',
    currentQuestionId: data.current_question_id || undefined,
    createdAt: data.created_at
  }
}

export const getSessionByJoinCode = async (joinCode: string): Promise<Session | null> => {
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .eq('join_code', joinCode)
    .single()

  if (error) return null

  return {
    id: data.id,
    quizId: data.quiz_id,
    hostId: data.host_id,
    joinCode: data.join_code,
    status: data.status as 'waiting' | 'active' | 'completed',
    currentQuestionId: data.current_question_id || undefined,
    createdAt: data.created_at
  }
}

export const getSessionById = async (id: string): Promise<Session | null> => {
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .eq('id', id)
    .single()

  if (error) return null

  return {
    id: data.id,
    quizId: data.quiz_id,
    hostId: data.host_id,
    joinCode: data.join_code,
    status: data.status as 'waiting' | 'active' | 'completed',
    currentQuestionId: data.current_question_id || undefined,
    createdAt: data.created_at
  }
}

export const updateSessionStatus = async (sessionId: string, status: 'waiting' | 'active' | 'completed'): Promise<void> => {
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)

  if (error) throw error
}

// Player operations
export const createPlayer = async (sessionId: string, nickname: string, userId?: string | null): Promise<Player> => {
  const { data, error } = await supabase
    .from('players')
    .insert({
      session_id: sessionId,
      nickname,
      score: 0,
      user_id: userId || null
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    sessionId: data.session_id,
    nickname: data.nickname,
    score: data.score,
    joinedAt: data.joined_at
  }
}

export const getPlayersBySessionId = async (sessionId: string): Promise<Player[]> => {
  const { data, error } = await supabase
    .from('players')
    .select()
    .eq('session_id', sessionId)
    .order('score', { ascending: false })

  if (error) throw error

  return data.map(p => ({
    id: p.id,
    sessionId: p.session_id,
    nickname: p.nickname,
    score: p.score,
    joinedAt: p.joined_at
  }))
}

// Player answer operations
export const submitPlayerAnswer = async (
  playerId: string,
  questionId: string,
  selectedAnswer: string,
  isCorrect: boolean
): Promise<PlayerAnswer> => {
  const { data, error } = await supabase
    .from('player_answers')
    .insert({
      player_id: playerId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    playerId: data.player_id,
    questionId: data.question_id,
    selectedAnswer: data.selected_answer,
    isCorrect: data.is_correct,
    answeredAt: data.answered_at
  }
}

// Update player score
export const updatePlayerScore = async (playerId: string, newScore: number): Promise<void> => {
  const { error } = await supabase
    .from('players')
    .update({ score: newScore })
    .eq('id', playerId)

  if (error) throw error
}

// Get player by ID
export const getPlayerById = async (playerId: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select()
    .eq('id', playerId)
    .single()

  if (error) return null

  return {
    id: data.id,
    sessionId: data.session_id,
    nickname: data.nickname,
    score: data.score,
    joinedAt: data.joined_at
  }
}

// User game history operations
export const recordGameHistory = async (
  userId: string,
  sessionId: string,
  finalScore: number,
  finalRank: number,
  questionsAnswered: number,
  correctAnswers: number,
  completionTime?: number
): Promise<void> => {
  const { error } = await supabase
    .from('user_game_history')
    .insert({
      user_id: userId,
      session_id: sessionId,
      final_score: finalScore,
      final_rank: finalRank,
      questions_answered: questionsAnswered,
      correct_answers: correctAnswers,
      completion_time: completionTime ? `${completionTime} milliseconds` : null
    })

  if (error) throw error
}

// Get user statistics
export const getUserStatistics = async (userId: string) => {
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) throw profileError

  // Get accuracy
  const { data: accuracy } = await supabase.rpc('get_user_accuracy', {
    user_uuid: userId
  })

  // Get leaderboard rank
  const { data: rank } = await supabase.rpc('get_user_leaderboard_rank', {
    user_uuid: userId
  })

  // Get recent games
  const { data: recentGames } = await supabase
    .from('user_game_history')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(10)

  return {
    ...profile,
    accuracy: accuracy || 0,
    leaderboardRank: rank,
    recentGames: recentGames || []
  }
}

// Get global leaderboard
export const getGlobalLeaderboard = async (limit: number = 50) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, total_correct_answers, total_games_played')
    .gt('total_games_played', 0)
    .order('total_correct_answers', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map((user, index) => ({
    rank: index + 1,
    user,
    totalCorrectAnswers: user.total_correct_answers,
    totalGamesPlayed: user.total_games_played,
    accuracy: user.total_games_played > 0 
      ? Math.round((user.total_correct_answers / (user.total_games_played * 10)) * 100) // Assuming ~10 questions per game
      : 0
  }))
}