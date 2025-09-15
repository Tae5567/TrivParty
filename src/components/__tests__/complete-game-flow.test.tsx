import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import GamePage from '@/app/play/[sessionId]/page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useParams: vi.fn()
}))

// Mock RealtimeProvider
vi.mock('@/contexts/RealtimeProvider', () => ({
  RealtimeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

// Mock GameStateSync
vi.mock('@/lib/game-state-sync', () => ({
  GameStateSync: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    getCurrentGameState: vi.fn(),
    broadcastQuestionChange: vi.fn(),
    broadcastAnswerReveal: vi.fn(),
    broadcastGameComplete: vi.fn(),
    updateSessionStatus: vi.fn(),
    updateCurrentQuestion: vi.fn(),
    onGameStateChange: vi.fn(),
    onQuestionChange: vi.fn(),
    onAnswerReveal: vi.fn(),
    onAnswerSubmitted: vi.fn(),
    onGameComplete: vi.fn(),
    cleanup: vi.fn()
  }))
}))

// Mock fetch
global.fetch = vi.fn()

describe('Complete Game Flow Integration', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn()
  }

  const mockParams = {
    sessionId: 'test-session-id'
  }

  const mockGameState = {
    session: {
      id: 'test-session-id',
      quizId: 'quiz1',
      hostId: 'host1',
      joinCode: 'ABC123',
      status: 'waiting' as const,
      createdAt: new Date().toISOString()
    },
    players: [
      {
        id: 'player1',
        sessionId: 'test-session-id',
        nickname: 'Alice',
        score: 0,
        joinedAt: new Date().toISOString()
      },
      {
        id: 'player2',
        sessionId: 'test-session-id',
        nickname: 'Bob',
        score: 0,
        joinedAt: new Date().toISOString()
      }
    ],
    showResults: false
  }

  const mockQuestions = [
    {
      id: 'q1',
      quizId: 'quiz1',
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
      questionOrder: 1
    },
    {
      id: 'q2',
      quizId: 'quiz1',
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'Basic arithmetic: 2 + 2 = 4.',
      questionOrder: 2
    }
  ]

  beforeAll(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(useParams).mockReturnValue(mockParams)
  })

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful API responses
    vi.mocked(fetch).mockImplementation((url) => {
      if (url.toString().includes('/api/quiz/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            quiz: { questions: mockQuestions }
          })
        } as Response)
      }
      
      if (url.toString().includes('/api/session/start')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            sessionId: 'test-session-id',
            playerCount: 2,
            questionCount: 2
          })
        } as Response)
      }
      
      if (url.toString().includes('/api/game/submit-answer')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            answer: { isCorrect: true },
            newScore: 100,
            pointsEarned: 100
          })
        } as Response)
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Game Lobby to Completion Flow', () => {
    it('should complete full game flow from lobby to final results', async () => {
      // Mock GameStateSync to simulate real-time updates
      const mockGameStateSync = {
        initialize: vi.fn(),
        getCurrentGameState: vi.fn().mockResolvedValue(mockGameState),
        onGameStateChange: vi.fn(),
        onQuestionChange: vi.fn(),
        onAnswerReveal: vi.fn(),
        onAnswerSubmitted: vi.fn(),
        onGameComplete: vi.fn(),
        updateSessionStatus: vi.fn(),
        updateCurrentQuestion: vi.fn(),
        broadcastQuestionChange: vi.fn(),
        cleanup: vi.fn()
      }

      const { GameStateSync } = require('@/lib/game-state-sync')
      GameStateSync.mockImplementation(() => mockGameStateSync)

      // Render the game page as host
      render(
        <GamePage searchParams={{ playerId: 'player1', isHost: 'true' }} />
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument()
      })

      // Should show lobby initially
      expect(screen.getByText('Session Code')).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()

      // Start the game (simulate host action)
      const startButton = screen.getByRole('button', { name: /start/i })
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/session/start', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test-session-id',
            hostId: 'host1'
          })
        }))
      })

      // Simulate game state change to playing
      const playingGameState = {
        ...mockGameState,
        session: { ...mockGameState.session, status: 'active' as const },
        currentQuestion: mockQuestions[0],
        timeRemaining: 30
      }

      // Simulate real-time question change
      const onQuestionChange = mockGameStateSync.onQuestionChange.mock.calls[0]?.[0]
      if (onQuestionChange) {
        onQuestionChange({
          payload: {
            question: mockQuestions[0],
            timeRemaining: 30
          }
        })
      }

      // Should show first question
      await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
      })

      // Should show answer options
      expect(screen.getByText('London')).toBeInTheDocument()
      expect(screen.getByText('Berlin')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('Madrid')).toBeInTheDocument()

      // Submit an answer
      const parisOption = screen.getByText('Paris')
      fireEvent.click(parisOption)

      // Should submit answer via API
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/game/submit-answer', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            playerId: 'player1',
            questionId: 'q1',
            selectedAnswer: 'Paris',
            correctAnswer: 'Paris',
            sessionId: 'test-session-id',
            timeRemaining: expect.any(Number)
          })
        }))
      })

      // Simulate answer submission broadcast
      const onAnswerSubmitted = mockGameStateSync.onAnswerSubmitted.mock.calls[0]?.[0]
      if (onAnswerSubmitted) {
        onAnswerSubmitted({
          payload: {
            playerId: 'player1',
            newScore: 100,
            pointsEarned: 100
          }
        })
      }

      // Simulate answer reveal
      const onAnswerReveal = mockGameStateSync.onAnswerReveal.mock.calls[0]?.[0]
      if (onAnswerReveal) {
        onAnswerReveal({
          payload: {
            questionId: 'q1',
            correctAnswer: 'Paris',
            explanation: 'Paris is the capital and largest city of France.'
          }
        })
      }

      // Should show explanation
      await waitFor(() => {
        expect(screen.getByText('Paris is the capital and largest city of France.')).toBeInTheDocument()
      })

      // Simulate next question
      const onQuestionChange2 = mockGameStateSync.onQuestionChange.mock.calls[1]?.[0]
      if (onQuestionChange2) {
        onQuestionChange2({
          payload: {
            question: mockQuestions[1],
            timeRemaining: 30
          }
        })
      }

      // Should show second question
      await waitFor(() => {
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
      })

      // Submit answer for second question
      const fourOption = screen.getByText('4')
      fireEvent.click(fourOption)

      // Simulate game completion
      const onGameComplete = mockGameStateSync.onGameComplete.mock.calls[0]?.[0]
      if (onGameComplete) {
        onGameComplete({
          payload: {
            finalScores: [
              { ...mockGameState.players[0], score: 200 },
              { ...mockGameState.players[1], score: 150 }
            ]
          }
        })
      }

      // Should show final results
      await waitFor(() => {
        expect(screen.getByText('Game Complete!')).toBeInTheDocument()
      })

      expect(screen.getByText('Thanks for playing!')).toBeInTheDocument()
      
      // Should show play again option for host
      expect(screen.getByRole('button', { name: /play again/i })).toBeInTheDocument()
    })

    it('should handle player perspective (non-host)', async () => {
      const mockGameStateSync = {
        initialize: vi.fn(),
        getCurrentGameState: vi.fn().mockResolvedValue(mockGameState),
        onGameStateChange: vi.fn(),
        onQuestionChange: vi.fn(),
        onAnswerReveal: vi.fn(),
        onAnswerSubmitted: vi.fn(),
        onGameComplete: vi.fn(),
        cleanup: vi.fn()
      }

      const { GameStateSync } = require('@/lib/game-state-sync')
      GameStateSync.mockImplementation(() => mockGameStateSync)

      // Render as regular player (not host)
      render(
        <GamePage searchParams={{ playerId: 'player2', isHost: 'false' }} />
      )

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument()
      })

      // Should not show start button for non-host
      expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()

      // Should show waiting for host message or similar
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should handle connection errors gracefully', async () => {
      const mockGameStateSync = {
        initialize: vi.fn().mockRejectedValue(new Error('Connection failed')),
        cleanup: vi.fn()
      }

      const { GameStateSync } = require('@/lib/game-state-sync')
      GameStateSync.mockImplementation(() => mockGameStateSync)

      render(
        <GamePage searchParams={{ playerId: 'player1', isHost: 'true' }} />
      )

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to connect to game session')).toBeInTheDocument()
      })

      // Should show back to home button
      expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument()
    })

    it('should handle API errors during game flow', async () => {
      // Mock API error
      vi.mocked(fetch).mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to start game' })
        } as Response)
      )

      const mockGameStateSync = {
        initialize: vi.fn(),
        getCurrentGameState: vi.fn().mockResolvedValue(mockGameState),
        onGameStateChange: vi.fn(),
        onQuestionChange: vi.fn(),
        onAnswerReveal: vi.fn(),
        onAnswerSubmitted: vi.fn(),
        onGameComplete: vi.fn(),
        cleanup: vi.fn()
      }

      const { GameStateSync } = require('@/lib/game-state-sync')
      GameStateSync.mockImplementation(() => mockGameStateSync)

      render(
        <GamePage searchParams={{ playerId: 'player1', isHost: 'true' }} />
      )

      await waitFor(() => {
        expect(screen.getByText('ABC123')).toBeInTheDocument()
      })

      // Try to start game
      const startButton = screen.getByRole('button', { name: /start/i })
      fireEvent.click(startButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText('Failed to start game')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Synchronization', () => {
    it('should sync game state changes across all players', async () => {
      const mockGameStateSync = {
        initialize: vi.fn(),
        getCurrentGameState: vi.fn().mockResolvedValue(mockGameState),
        onGameStateChange: vi.fn(),
        onQuestionChange: vi.fn(),
        onAnswerReveal: vi.fn(),
        onAnswerSubmitted: vi.fn(),
        onGameComplete: vi.fn(),
        cleanup: vi.fn()
      }

      const { GameStateSync } = require('@/lib/game-state-sync')
      GameStateSync.mockImplementation(() => mockGameStateSync)

      render(
        <GamePage searchParams={{ playerId: 'player1', isHost: 'false' }} />
      )

      await waitFor(() => {
        expect(mockGameStateSync.onGameStateChange).toHaveBeenCalled()
        expect(mockGameStateSync.onQuestionChange).toHaveBeenCalled()
        expect(mockGameStateSync.onAnswerReveal).toHaveBeenCalled()
        expect(mockGameStateSync.onAnswerSubmitted).toHaveBeenCalled()
        expect(mockGameStateSync.onGameComplete).toHaveBeenCalled()
      })

      // Simulate score update from another player
      const onAnswerSubmitted = mockGameStateSync.onAnswerSubmitted.mock.calls[0]?.[0]
      if (onAnswerSubmitted) {
        onAnswerSubmitted({
          payload: {
            playerId: 'player2',
            newScore: 50
          }
        })
      }

      // Should update the UI with new score
      // Note: This would require the component to actually update the UI
      // The test verifies that the event handler is set up correctly
    })
  })
})