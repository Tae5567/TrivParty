import { supabase } from './supabase'
import type { Player, PlayerAnswer } from '@/types'
import { wasPowerUpUsed } from './power-ups'

// Scoring configuration
export const SCORING_CONFIG = {
  CORRECT_ANSWER_POINTS: 100,
  INCORRECT_ANSWER_POINTS: 0,
  TIME_BONUS_MULTIPLIER: 0.1, // 10% bonus for quick answers
  MAX_TIME_BONUS: 50, // Maximum bonus points
} as const

/**
 * Calculate score for a player's answer
 */
export function calculateAnswerScore(
  isCorrect: boolean,
  timeRemaining?: number,
  maxTime: number = 30,
  hasDoublePoints: boolean = false
): number {
  if (!isCorrect) {
    return SCORING_CONFIG.INCORRECT_ANSWER_POINTS
  }

  let score = SCORING_CONFIG.CORRECT_ANSWER_POINTS

  // Add time bonus if timeRemaining is provided
  if (timeRemaining !== undefined && timeRemaining > 0) {
    const timeBonus = Math.min(
      (timeRemaining / maxTime) * SCORING_CONFIG.MAX_TIME_BONUS,
      SCORING_CONFIG.MAX_TIME_BONUS
    )
    score += Math.round(timeBonus)
  }

  // Apply double points power-up
  if (hasDoublePoints) {
    score *= 2
  }

  return score
}

/**
 * Submit a player's answer and update their score
 */
export async function submitAnswerAndUpdateScore(
  playerId: string,
  questionId: string,
  selectedAnswer: string,
  correctAnswer: string,
  timeRemaining?: number
): Promise<{ answer: PlayerAnswer; newScore: number; pointsEarned: number; hasDoublePoints: boolean }> {
  const isCorrect = selectedAnswer === correctAnswer
  
  // Check if player used double points power-up on this question
  const hasDoublePoints = await wasPowerUpUsed(playerId, 'double_points', questionId)
  
  const pointsEarned = calculateAnswerScore(isCorrect, timeRemaining, 30, hasDoublePoints)

  // Get current player score
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('score')
    .eq('id', playerId)
    .single()

  if (playerError) {
    throw new Error(`Failed to get player score: ${playerError.message}`)
  }

  const newScore = player.score + pointsEarned

  // Start a transaction to submit answer and update score
  const { data: answer, error: answerError } = await supabase
    .from('player_answers')
    .insert({
      player_id: playerId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect
    })
    .select()
    .single()

  if (answerError) {
    throw new Error(`Failed to submit answer: ${answerError.message}`)
  }

  // Update player score
  const { error: scoreError } = await supabase
    .from('players')
    .update({ score: newScore })
    .eq('id', playerId)

  if (scoreError) {
    throw new Error(`Failed to update score: ${scoreError.message}`)
  }

  return {
    answer: {
      id: answer.id,
      playerId: answer.player_id,
      questionId: answer.question_id,
      selectedAnswer: answer.selected_answer,
      isCorrect: answer.is_correct,
      answeredAt: answer.answered_at
    },
    newScore,
    pointsEarned,
    hasDoublePoints
  }
}

/**
 * Get leaderboard for a session (players ordered by score)
 */
export async function getSessionLeaderboard(sessionId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false })
    .order('joined_at', { ascending: true }) // Tie-breaker: earlier join time wins

  if (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`)
  }

  return data.map(p => ({
    id: p.id,
    sessionId: p.session_id,
    nickname: p.nickname,
    score: p.score,
    joinedAt: p.joined_at
  }))
}

/**
 * Get player statistics for a session
 */
export async function getPlayerStats(playerId: string): Promise<{
  totalAnswers: number
  correctAnswers: number
  accuracy: number
  averageResponseTime: number
}> {
  const { data, error } = await supabase
    .from('player_answers')
    .select('is_correct, answered_at')
    .eq('player_id', playerId)

  if (error) {
    throw new Error(`Failed to get player stats: ${error.message}`)
  }

  const totalAnswers = data.length
  const correctAnswers = data.filter(a => a.is_correct).length
  const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

  // Note: Average response time would require storing question start times
  // For now, we'll return 0 as a placeholder
  const averageResponseTime = 0

  return {
    totalAnswers,
    correctAnswers,
    accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
    averageResponseTime
  }
}

/**
 * Reset all player scores in a session (useful for replaying)
 */
export async function resetSessionScores(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ score: 0 })
    .eq('session_id', sessionId)

  if (error) {
    throw new Error(`Failed to reset scores: ${error.message}`)
  }
}