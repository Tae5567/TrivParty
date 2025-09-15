import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useScoring } from '../useScoring'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useScoring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitAnswer', () => {
    it('should submit answer successfully', async () => {
      const mockResponse = {
        success: true,
        pointsEarned: 100,
        newScore: 150,
        isCorrect: true
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useScoring())

      await act(async () => {
        const response = await result.current.submitAnswer(
          'player-1',
          'question-1',
          'Option A',
          'Option A',
          'session-1',
          25
        )
        expect(response).toEqual(mockResponse)
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.lastScoreUpdate).toEqual({
        pointsEarned: 100,
        newScore: 150,
        isCorrect: true
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/game/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: 'player-1',
          questionId: 'question-1',
          selectedAnswer: 'Option A',
          correctAnswer: 'Option A',
          sessionId: 'session-1',
          timeRemaining: 25
        })
      })
    })

    it('should handle submit answer error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Database error' })
      })

      const { result } = renderHook(() => useScoring())

      await act(async () => {
        try {
          await result.current.submitAnswer(
            'player-1',
            'question-1',
            'Option A',
            'Option A',
            'session-1'
          )
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBe('Database error')
      expect(result.current.lastScoreUpdate).toBe(null)
    })

    it('should set isSubmitting during request', async () => {
      let resolvePromise: (value: any) => void
      const promise = new Promise(resolve => {
        resolvePromise = resolve
      })

      mockFetch.mockReturnValue(promise)

      const { result } = renderHook(() => useScoring())

      act(() => {
        result.current.submitAnswer(
          'player-1',
          'question-1',
          'Option A',
          'Option A',
          'session-1'
        )
      })

      expect(result.current.isSubmitting).toBe(true)

      await act(async () => {
        resolvePromise!({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            pointsEarned: 100,
            newScore: 150,
            isCorrect: true
          })
        })
      })

      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('fetchLeaderboard', () => {
    it('should fetch leaderboard successfully', async () => {
      const mockLeaderboard = [
        {
          id: 'player-1',
          sessionId: 'session-1',
          nickname: 'Alice',
          score: 150,
          joinedAt: '2024-01-01T00:00:00Z'
        }
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ leaderboard: mockLeaderboard })
      })

      const { result } = renderHook(() => useScoring())

      let leaderboard: unknown
      await act(async () => {
        leaderboard = await result.current.fetchLeaderboard('session-1')
      })

      expect(leaderboard).toEqual(mockLeaderboard)
      expect(mockFetch).toHaveBeenCalledWith('/api/game/leaderboard?sessionId=session-1')
    })

    it('should handle fetch leaderboard error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Session not found' })
      })

      const { result } = renderHook(() => useScoring())

      await act(async () => {
        try {
          await result.current.fetchLeaderboard('session-1')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      })

      expect(result.current.error).toBe('Session not found')
    })
  })

  describe('utility functions', () => {
    it('should clear score update', () => {
      const { result } = renderHook(() => useScoring())

      // Set initial state with score update
      act(() => {
        result.current.submitAnswer('player-1', 'question-1', 'A', 'A', 'session-1')
      })

      act(() => {
        result.current.clearScoreUpdate()
      })

      expect(result.current.lastScoreUpdate).toBe(null)
    })

    it('should clear error', async () => {
      const { result } = renderHook(() => useScoring())

      // Simulate an error state
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' })
      })

      await act(async () => {
        try {
          await result.current.submitAnswer('player-1', 'question-1', 'A', 'A', 'session-1')
        } catch (error) {
          // Expected error
        }
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBe(null)
    })
  })
})