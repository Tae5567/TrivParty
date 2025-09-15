import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock environment variables before importing modules
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  }
}))

import { calculateAnswerScore } from '../scoring'

// Simple integration test for game flow logic without complex mocking
describe('Game Flow Core Logic', () => {
  describe('Score Calculation', () => {
    it('should calculate correct scores based on time remaining', () => {
      // Test correct answer with full time
      const fullTimeScore = calculateAnswerScore(true, 30, 30)
      expect(fullTimeScore).toBe(150) // 100 base + 50 time bonus

      // Test correct answer with half time
      const halfTimeScore = calculateAnswerScore(true, 15, 30)
      expect(halfTimeScore).toBe(125) // 100 base + 25 time bonus

      // Test correct answer with no time
      const noTimeScore = calculateAnswerScore(true, 0, 30)
      expect(noTimeScore).toBe(100) // 100 base + 0 time bonus

      // Test incorrect answer
      const incorrectScore = calculateAnswerScore(false, 30, 30)
      expect(incorrectScore).toBe(0) // Always 0 for incorrect
    })

    it('should handle edge cases in scoring', () => {
      // Test with undefined time remaining
      const undefinedTimeScore = calculateAnswerScore(true)
      expect(undefinedTimeScore).toBe(100) // Base score only

      // Test with negative time (shouldn't happen but handle gracefully)
      const negativeTimeScore = calculateAnswerScore(true, -5, 30)
      expect(negativeTimeScore).toBe(100) // Should not add negative bonus

      // Test with time greater than max (shouldn't happen but handle gracefully)
      const overTimeScore = calculateAnswerScore(true, 35, 30)
      expect(overTimeScore).toBe(150) // Should cap at max bonus
    })
  })

  describe('Game State Transitions', () => {
    it('should validate game phase transitions', () => {
      const validTransitions = [
        { from: 'waiting', to: 'question', valid: true },
        { from: 'question', to: 'results', valid: true },
        { from: 'results', to: 'question', valid: true },
        { from: 'results', to: 'complete', valid: true },
        { from: 'complete', to: 'waiting', valid: true }, // restart
        { from: 'question', to: 'complete', valid: false }, // skip results
        { from: 'waiting', to: 'results', valid: false }, // skip question
      ]

      validTransitions.forEach(({ from, to, valid }) => {
        const isValidTransition = validateGamePhaseTransition(from, to)
        expect(isValidTransition).toBe(valid)
      })
    })
  })

  describe('Question Progression Logic', () => {
    it('should correctly determine next question index', () => {
      const questions = [
        { id: 'q1', questionOrder: 1 },
        { id: 'q2', questionOrder: 2 },
        { id: 'q3', questionOrder: 3 }
      ]

      // Test normal progression
      expect(getNextQuestionIndex(0, questions)).toBe(1)
      expect(getNextQuestionIndex(1, questions)).toBe(2)
      
      // Test end of quiz
      expect(getNextQuestionIndex(2, questions)).toBe(-1) // No more questions
      
      // Test invalid current index
      expect(getNextQuestionIndex(-1, questions)).toBe(0) // Start from beginning
      expect(getNextQuestionIndex(10, questions)).toBe(-1) // Out of bounds
    })

    it('should handle empty question arrays', () => {
      expect(getNextQuestionIndex(0, [])).toBe(-1)
      expect(getNextQuestionIndex(-1, [])).toBe(-1)
    })
  })

  describe('Player Answer Validation', () => {
    it('should validate answer correctness', () => {
      const question = {
        id: 'q1',
        correctAnswer: 'Paris',
        options: ['London', 'Berlin', 'Paris', 'Madrid']
      }

      expect(isAnswerCorrect('Paris', question.correctAnswer)).toBe(true)
      expect(isAnswerCorrect('London', question.correctAnswer)).toBe(false)
      expect(isAnswerCorrect('paris', question.correctAnswer)).toBe(false) // Case sensitive
      expect(isAnswerCorrect('', question.correctAnswer)).toBe(false)
    })

    it('should validate answer options', () => {
      const question = {
        options: ['A', 'B', 'C', 'D']
      }

      expect(isValidAnswerOption('A', question.options)).toBe(true)
      expect(isValidAnswerOption('E', question.options)).toBe(false)
      expect(isValidAnswerOption('', question.options)).toBe(false)
    })
  })

  describe('Game Completion Logic', () => {
    it('should determine when game is complete', () => {
      const questions = [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]

      expect(isGameComplete(0, questions)).toBe(false) // First question
      expect(isGameComplete(1, questions)).toBe(false) // Middle question
      expect(isGameComplete(2, questions)).toBe(false) // Last question (not answered yet)
      expect(isGameComplete(3, questions)).toBe(true)  // Beyond last question
    })

    it('should handle edge cases for game completion', () => {
      expect(isGameComplete(0, [])).toBe(true) // No questions = complete
      expect(isGameComplete(-1, [{ id: 'q1' }])).toBe(false) // Invalid index
    })
  })

  describe('Leaderboard Sorting', () => {
    it('should sort players correctly by score', () => {
      const players = [
        { id: 'p1', nickname: 'Alice', score: 100, joinedAt: '2023-01-01T10:00:00Z' },
        { id: 'p2', nickname: 'Bob', score: 150, joinedAt: '2023-01-01T10:01:00Z' },
        { id: 'p3', nickname: 'Charlie', score: 100, joinedAt: '2023-01-01T09:59:00Z' }
      ]

      const sorted = sortPlayersByScore(players)
      
      expect(sorted[0].nickname).toBe('Bob') // Highest score
      expect(sorted[1].nickname).toBe('Charlie') // Same score as Alice, but joined earlier
      expect(sorted[2].nickname).toBe('Alice') // Lowest priority
    })

    it('should handle empty player arrays', () => {
      expect(sortPlayersByScore([])).toEqual([])
    })
  })
})

// Helper functions for testing game logic
function validateGamePhaseTransition(from: string, to: string): boolean {
  const validTransitions: Record<string, string[]> = {
    waiting: ['question'],
    question: ['results'],
    results: ['question', 'complete'],
    complete: ['waiting'] // restart
  }
  
  return validTransitions[from]?.includes(to) ?? false
}

function getNextQuestionIndex(currentIndex: number, questions: any[]): number {
  if (questions.length === 0) return -1
  if (currentIndex < 0) return 0
  if (currentIndex >= questions.length - 1) return -1
  return currentIndex + 1
}

function isAnswerCorrect(selectedAnswer: string, correctAnswer: string): boolean {
  return selectedAnswer === correctAnswer
}

function isValidAnswerOption(answer: string, options: string[]): boolean {
  return options.includes(answer)
}

function isGameComplete(currentQuestionIndex: number, questions: any[]): boolean {
  if (questions.length === 0) return true
  return currentQuestionIndex >= questions.length
}

function sortPlayersByScore(players: any[]): unknown[] {
  return [...players].sort((a, b) => {
    // Primary sort: score (descending)
    if (a.score !== b.score) {
      return b.score - a.score
    }
    
    // Tie-breaker: joined time (ascending - earlier is better)
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })
}