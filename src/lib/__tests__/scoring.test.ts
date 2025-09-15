import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  calculateAnswerScore, 
  submitAnswerAndUpdateScore, 
  getSessionLeaderboard,
  getPlayerStats,
  resetSessionScores,
  SCORING_CONFIG 
} from '../scoring'
import { supabase } from '../supabase'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            order: vi.fn()
          }))
        })),
        order: vi.fn(() => ({
          order: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

describe('Scoring System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateAnswerScore', () => {
    it('should return 0 points for incorrect answers', () => {
      const score = calculateAnswerScore(false)
      expect(score).toBe(SCORING_CONFIG.INCORRECT_ANSWER_POINTS)
    })

    it('should return base points for correct answers without time bonus', () => {
      const score = calculateAnswerScore(true)
      expect(score).toBe(SCORING_CONFIG.CORRECT_ANSWER_POINTS)
    })

    it('should add time bonus for quick correct answers', () => {
      const timeRemaining = 25 // out of 30 seconds
      const maxTime = 30
      const score = calculateAnswerScore(true, timeRemaining, maxTime)
      
      const expectedBonus = Math.round((timeRemaining / maxTime) * SCORING_CONFIG.MAX_TIME_BONUS)
      const expectedScore = SCORING_CONFIG.CORRECT_ANSWER_POINTS + expectedBonus
      
      expect(score).toBe(expectedScore)
    })

    it('should cap time bonus at maximum', () => {
      const timeRemaining = 30 // full time remaining
      const maxTime = 30
      const score = calculateAnswerScore(true, timeRemaining, maxTime)
      
      const expectedScore = SCORING_CONFIG.CORRECT_ANSWER_POINTS + SCORING_CONFIG.MAX_TIME_BONUS
      expect(score).toBe(expectedScore)
    })

    it('should handle zero time remaining', () => {
      const score = calculateAnswerScore(true, 0, 30)
      expect(score).toBe(SCORING_CONFIG.CORRECT_ANSWER_POINTS)
    })
  })

  describe('submitAnswerAndUpdateScore', () => {
    it('should submit correct answer and update score', async () => {
      const mockPlayer = { score: 50 }
      const mockAnswer = {
        id: 'answer-1',
        player_id: 'player-1',
        question_id: 'question-1',
        selected_answer: 'Option A',
        is_correct: true,
        answered_at: '2024-01-01T00:00:00Z'
      }

      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockAnswer, error: null })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      const result = await submitAnswerAndUpdateScore(
        'player-1',
        'question-1',
        'Option A',
        'Option A',
        25
      )

      expect(result.answer.isCorrect).toBe(true)
      expect(result.newScore).toBeGreaterThan(mockPlayer.score)
      expect(result.pointsEarned).toBeGreaterThan(0)
    })

    it('should handle incorrect answers', async () => {
      const mockPlayer = { score: 50 }
      const mockAnswer = {
        id: 'answer-1',
        player_id: 'player-1',
        question_id: 'question-1',
        selected_answer: 'Option B',
        is_correct: false,
        answered_at: '2024-01-01T00:00:00Z'
      }

      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockPlayer, error: null })
          }))
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockAnswer, error: null })
          }))
        })),
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      const result = await submitAnswerAndUpdateScore(
        'player-1',
        'question-1',
        'Option B',
        'Option A'
      )

      expect(result.answer.isCorrect).toBe(false)
      expect(result.newScore).toBe(mockPlayer.score)
      expect(result.pointsEarned).toBe(0)
    })
  })

  describe('getSessionLeaderboard', () => {
    it('should return players sorted by score descending', async () => {
      const mockPlayers = [
        {
          id: 'player-1',
          session_id: 'session-1',
          nickname: 'Alice',
          score: 150,
          joined_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'player-2',
          session_id: 'session-1',
          nickname: 'Bob',
          score: 200,
          joined_at: '2024-01-01T00:01:00Z'
        }
      ]

      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: mockPlayers, error: null })
            }))
          }))
        }))
      })

      const leaderboard = await getSessionLeaderboard('session-1')

      expect(leaderboard).toHaveLength(2)
      expect(leaderboard[0].nickname).toBe('Alice')
      expect(leaderboard[1].nickname).toBe('Bob')
    })
  })

  describe('getPlayerStats', () => {
    it('should calculate player statistics correctly', async () => {
      const mockAnswers = [
        { is_correct: true, answered_at: '2024-01-01T00:00:00Z' },
        { is_correct: false, answered_at: '2024-01-01T00:01:00Z' },
        { is_correct: true, answered_at: '2024-01-01T00:02:00Z' }
      ]

      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: mockAnswers, error: null })
        }))
      })

      const stats = await getPlayerStats('player-1')

      expect(stats.totalAnswers).toBe(3)
      expect(stats.correctAnswers).toBe(2)
      expect(stats.accuracy).toBe(66.67)
    })

    it('should handle no answers', async () => {
      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null })
        }))
      })

      const stats = await getPlayerStats('player-1')

      expect(stats.totalAnswers).toBe(0)
      expect(stats.correctAnswers).toBe(0)
      expect(stats.accuracy).toBe(0)
    })
  })

  describe('resetSessionScores', () => {
    it('should reset all player scores to 0', async () => {
      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      })

      await resetSessionScores('session-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
    })
  })
})