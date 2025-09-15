import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { describe } from 'node:test'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { ACHIEVEMENTS, checkAndAwardAchievements } from '../achievements'
import { supabase } from '../supabase'

import { vi } from 'vitest'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
    })),
  },
}))

describe('Achievements System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Achievement Definitions', () => {
    it('has all required achievement types', () => {
      const expectedTypes = [
        'first_game',
        'perfect_game', 
        'speed_demon',
        'social_butterfly',
        'quiz_master',
        'streak_master',
        'comeback_kid'
      ]

      expectedTypes.forEach(type => {
        expect(ACHIEVEMENTS[type as keyof typeof ACHIEVEMENTS]).toBeDefined()
      })
    })

    it('has proper achievement structure', () => {
      Object.values(ACHIEVEMENTS).forEach(achievement => {
        expect(achievement).toHaveProperty('type')
        expect(achievement).toHaveProperty('name')
        expect(achievement).toHaveProperty('description')
        expect(achievement).toHaveProperty('icon')
        expect(achievement).toHaveProperty('condition')
        expect(typeof achievement.condition).toBe('function')
      })
    })
  })

  describe('Achievement Conditions', () => {
    it('first_game achievement triggers on first game', () => {
      const condition = ACHIEVEMENTS.first_game.condition
      expect(condition({ gamesPlayed: 1 })).toBe(true)
      expect(condition({ gamesPlayed: 2 })).toBe(false)
    })

    it('perfect_game achievement triggers on 100% accuracy', () => {
      const condition = ACHIEVEMENTS.perfect_game.condition
      expect(condition({ correctAnswers: 5, totalQuestions: 5 })).toBe(true)
      expect(condition({ correctAnswers: 4, totalQuestions: 5 })).toBe(false)
      expect(condition({ correctAnswers: 0, totalQuestions: 0 })).toBe(false)
    })

    it('speed_demon achievement triggers on fast completion', () => {
      const condition = ACHIEVEMENTS.speed_demon.condition
      expect(condition({ completionTime: 25000, totalQuestions: 5 })).toBe(true)
      expect(condition({ completionTime: 35000, totalQuestions: 5 })).toBe(false)
      expect(condition({ completionTime: 25000, totalQuestions: 0 })).toBe(false)
    })

    it('social_butterfly achievement triggers with many unique players', () => {
      const condition = ACHIEVEMENTS.social_butterfly.condition
      expect(condition({ uniquePlayers: 10 })).toBe(true)
      expect(condition({ uniquePlayers: 15 })).toBe(true)
      expect(condition({ uniquePlayers: 5 })).toBe(false)
    })

    it('quiz_master achievement triggers with many created quizzes', () => {
      const condition = ACHIEVEMENTS.quiz_master.condition
      expect(condition({ quizzesCreated: 5 })).toBe(true)
      expect(condition({ quizzesCreated: 10 })).toBe(true)
      expect(condition({ quizzesCreated: 3 })).toBe(false)
    })

    it('streak_master achievement triggers with long streak', () => {
      const condition = ACHIEVEMENTS.streak_master.condition
      expect(condition({ bestStreak: 10 })).toBe(true)
      expect(condition({ bestStreak: 15 })).toBe(true)
      expect(condition({ bestStreak: 5 })).toBe(false)
    })

    it('comeback_kid achievement triggers on comeback win', () => {
      const condition = ACHIEVEMENTS.comeback_kid.condition
      expect(condition({ wasLastPlace: true, finalRank: 1 })).toBe(true)
      expect(condition({ wasLastPlace: false, finalRank: 1 })).toBe(false)
      expect(condition({ wasLastPlace: true, finalRank: 2 })).toBe(false)
    })
  })

  describe('checkAndAwardAchievements', () => {
    const mockUserId = 'user-123'
    const mockGameData = {
      correctAnswers: 5,
      totalQuestions: 5,
      completionTime: 25000,
      wasLastPlace: false,
      finalRank: 1,
    }

    beforeEach(() => {
      // Mock successful database responses
      const mockSupabase = supabase as any
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { 
              total_games_played: 1,
              best_streak: 5,
            }}),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      })
    })

    it('awards achievements for qualifying conditions', async () => {
      const mockSupabase = supabase as any
      
      // Mock existing achievements (none)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [] }),
        }),
      })

      // Mock profile data
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ 
              data: { 
                total_games_played: 1,
                best_streak: 5,
              }
            }),
          }),
        }),
      })

      // Mock other queries
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [] }),
      })

      const result = await checkAndAwardAchievements(mockUserId, mockGameData)
      
      // Should award first_game and perfect_game achievements
      expect(result).toHaveLength(2)
      expect(result.map(a => a.type)).toContain('first_game')
      expect(result.map(a => a.type)).toContain('perfect_game')
    })

    it('does not award existing achievements', async () => {
      const mockSupabase = supabase as any
      
      // Mock existing achievements
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            data: [
              { achievement_type: 'first_game' },
              { achievement_type: 'perfect_game' }
            ]
          }),
        }),
      })

      const result = await checkAndAwardAchievements(mockUserId, mockGameData)
      
      expect(result).toHaveLength(0)
    })

    it('handles database errors gracefully', async () => {
      const mockSupabase = supabase as any
      
      // Mock database error
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      })

      const result = await checkAndAwardAchievements(mockUserId, mockGameData)
      
      expect(result).toEqual([])
    })
  })
})