import { useState, useCallback } from 'react'
import type { Player } from '@/types'

interface ScoringState {
  isSubmitting: boolean
  error: string | null
  lastScoreUpdate: {
    pointsEarned: number
    newScore: number
    isCorrect: boolean
  } | null
}

export function useScoring() {
  const [state, setState] = useState<ScoringState>({
    isSubmitting: false,
    error: null,
    lastScoreUpdate: null
  })

  const submitAnswer = useCallback(async (
    playerId: string,
    questionId: string,
    selectedAnswer: string,
    correctAnswer: string,
    sessionId: string,
    timeRemaining?: number
  ) => {
    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const response = await fetch('/api/game/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId,
          questionId,
          selectedAnswer,
          correctAnswer,
          sessionId,
          timeRemaining
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answer')
      }

      setState(prev => ({
        ...prev,
        isSubmitting: false,
        lastScoreUpdate: {
          pointsEarned: data.pointsEarned,
          newScore: data.newScore,
          isCorrect: data.isCorrect
        }
      }))

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: errorMessage
      }))
      throw error
    }
  }, [])

  const fetchLeaderboard = useCallback(async (sessionId: string): Promise<Player[]> => {
    try {
      const response = await fetch(`/api/game/leaderboard?sessionId=${sessionId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch leaderboard')
      }

      return data.leaderboard
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  const clearScoreUpdate = useCallback(() => {
    setState(prev => ({ ...prev, lastScoreUpdate: null }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    submitAnswer,
    fetchLeaderboard,
    clearScoreUpdate,
    clearError
  }
}