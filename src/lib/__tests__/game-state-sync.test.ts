import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameStateSync } from '../game-state-sync'
import type { GameState, Question } from '@/types'

// Mock Supabase client
const mockChannel = {
  subscribe: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  on: vi.fn().mockReturnThis(),
}

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn().mockResolvedValue(undefined),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  createClientComponentClient: () => mockSupabase,
}))

describe('GameStateSync', () => {
  let gameStateSync: GameStateSync
  const sessionId = 'test-session-id'

  beforeEach(() => {
    gameStateSync = new GameStateSync(sessionId)
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await gameStateSync.cleanup()
  })

  describe('initialization', () => {
    it('should initialize with correct session ID', () => {
      expect(gameStateSync).toBeDefined()
    })

    it('should create channel with correct configuration', async () => {
      await gameStateSync.initialize()

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        `game_state:${sessionId}`,
        {
          config: {
            broadcast: { self: false },
            presence: { key: sessionId },
          },
        }
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  describe('broadcasting', () => {
    beforeEach(async () => {
      await gameStateSync.initialize()
    })

    it('should broadcast game state changes', async () => {
      const gameState: Partial<GameState> = {
        session: {
          id: sessionId,
          status: 'active',
        } as any,
      }

      await gameStateSync.broadcastGameState(gameState)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'game_state_sync',
        payload: {
          sessionId,
          gameState,
          timestamp: expect.any(String),
        },
      })
    })

    it('should broadcast question changes', async () => {
      const question: Question = {
        id: 'question-1',
        quizId: 'quiz-1',
        text: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Test explanation',
        questionOrder: 1,
      }
      const timeRemaining = 30

      await gameStateSync.broadcastQuestionChange(question, timeRemaining)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'question_changed',
        payload: {
          sessionId,
          question,
          timeRemaining,
          timestamp: expect.any(String),
        },
      })
    })

    it('should broadcast answer reveal', async () => {
      const questionId = 'question-1'
      const correctAnswer = 'A'
      const explanation = 'Test explanation'

      await gameStateSync.broadcastAnswerReveal(questionId, correctAnswer, explanation)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'answer_reveal',
        payload: {
          sessionId,
          questionId,
          correctAnswer,
          explanation,
          timestamp: expect.any(String),
        },
      })
    })

    it('should broadcast game completion', async () => {
      const finalScores = [
        { id: 'player-1', nickname: 'Player 1', score: 100 } as any,
        { id: 'player-2', nickname: 'Player 2', score: 80 } as any,
      ]

      await gameStateSync.broadcastGameComplete(finalScores)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'game_complete',
        payload: {
          sessionId,
          finalScores,
          timestamp: expect.any(String),
        },
      })
    })

    it('should throw error when broadcasting without initialization', async () => {
      const uninitializedSync = new GameStateSync('test')
      
      await expect(uninitializedSync.broadcastGameState({})).rejects.toThrow(
        'GameStateSync not initialized'
      )
    })
  })

  describe('database operations', () => {
    beforeEach(async () => {
      await gameStateSync.initialize()
    })

    it('should get current game state', async () => {
      const mockSession = {
        id: sessionId,
        quiz_id: 'quiz-1',
        host_id: 'host-1',
        join_code: 'ABC123',
        status: 'active',
        current_question_id: 'question-1',
        created_at: '2023-01-01T00:00:00Z',
      }

      const mockPlayers = [
        { id: 'player-1', nickname: 'Player 1', score: 100 },
        { id: 'player-2', nickname: 'Player 2', score: 80 },
      ]

      const mockQuestion = {
        id: 'question-1',
        quiz_id: 'quiz-1',
        text: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correct_answer: 'A',
        explanation: 'Test explanation',
        question_order: 1,
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'sessions') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockSession, error: null }),
              }),
            }),
          }
        }
        if (table === 'players') {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({ data: mockPlayers, error: null }),
              }),
            }),
          }
        }
        if (table === 'questions') {
          return {
            select: () => ({
              eq: () => ({
                single: () => ({ data: mockQuestion, error: null }),
              }),
            }),
          }
        }
        return mockSupabase
      })

      const gameState = await gameStateSync.getCurrentGameState()

      expect(gameState).toEqual({
        session: {
          id: sessionId,
          quizId: 'quiz-1',
          hostId: 'host-1',
          joinCode: 'ABC123',
          status: 'active',
          currentQuestionId: 'question-1',
          createdAt: '2023-01-01T00:00:00Z',
        },
        players: mockPlayers,
        currentQuestion: {
          id: 'question-1',
          quizId: 'quiz-1',
          text: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'Test explanation',
          questionOrder: 1,
        },
        showResults: false,
      })
    })

    it('should update session status', async () => {
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: () => ({ error: null }),
        }),
      })

      await gameStateSync.updateSessionStatus('active')

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })

    it('should update current question', async () => {
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: () => ({ error: null }),
        }),
      })

      await gameStateSync.updateCurrentQuestion('question-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions')
    })

    it('should update player score', async () => {
      mockSupabase.from.mockReturnValue({
        update: () => ({
          eq: () => ({ error: null }),
        }),
      })

      await gameStateSync.updatePlayerScore('player-1', 100)

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
    })

    it('should record player answer', async () => {
      mockSupabase.from.mockReturnValue({
        insert: () => ({ error: null }),
      })

      await gameStateSync.recordPlayerAnswer('player-1', 'question-1', 'A', true)

      expect(mockSupabase.from).toHaveBeenCalledWith('player_answers')
    })
  })

  describe('event subscriptions', () => {
    beforeEach(async () => {
      await gameStateSync.initialize()
    })

    it('should subscribe to game state changes', () => {
      const callback = vi.fn()
      gameStateSync.onGameStateChange(callback)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'game_state_sync' },
        callback
      )
    })

    it('should subscribe to question changes', () => {
      const callback = vi.fn()
      gameStateSync.onQuestionChange(callback)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'question_changed' },
        callback
      )
    })

    it('should subscribe to answer reveals', () => {
      const callback = vi.fn()
      gameStateSync.onAnswerReveal(callback)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'answer_reveal' },
        callback
      )
    })

    it('should subscribe to game completion', () => {
      const callback = vi.fn()
      gameStateSync.onGameComplete(callback)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'game_complete' },
        callback
      )
    })
  })

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await gameStateSync.initialize()
      await gameStateSync.cleanup()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })
})