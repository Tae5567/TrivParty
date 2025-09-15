import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { GameFlowManager } from '../game-flow-manager'
import { GameStateSync } from '../game-state-sync'
import type { Question, Player, GameState } from '@/types'

// Mock Supabase
vi.mock('../supabase', () => ({
  createClientComponentClient: () => ({
    channel: vi.fn(() => ({
      subscribe: vi.fn(),
      send: vi.fn(),
      on: vi.fn(),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        insert: vi.fn(),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  })
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Game Flow Integration', () => {
  let gameFlowManager: GameFlowManager
  let mockQuestions: Question[]
  let mockPlayers: Player[]
  let mockGameState: GameState
  const sessionId = 'test-session-id'

  beforeAll(() => {
    // Setup mock questions
    mockQuestions = [
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

    // Setup mock players
    mockPlayers = [
      {
        id: 'player1',
        sessionId,
        nickname: 'Alice',
        score: 0,
        joinedAt: new Date().toISOString()
      },
      {
        id: 'player2',
        sessionId,
        nickname: 'Bob',
        score: 0,
        joinedAt: new Date().toISOString()
      }
    ]

    // Setup mock game state
    mockGameState = {
      session: {
        id: sessionId,
        quizId: 'quiz1',
        hostId: 'host1',
        joinCode: 'ABC123',
        status: 'waiting',
        createdAt: new Date().toISOString()
      },
      players: mockPlayers,
      showResults: false
    }
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    
    gameFlowManager = new GameFlowManager(sessionId, {
      questionTimeLimit: 5, // Short time for testing
      resultsDisplayTime: 2,
      autoAdvance: false // Disable auto-advance for controlled testing
    })

    // Mock the GameStateSync methods
    vi.spyOn(gameFlowManager['gameStateSync'], 'initialize').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'getCurrentGameState').mockResolvedValue(mockGameState)
    vi.spyOn(gameFlowManager['gameStateSync'], 'updateSessionStatus').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'updateCurrentQuestion').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'broadcastQuestionChange').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'broadcastAnswerReveal').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'broadcastAnswerSubmitted').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'broadcastGameComplete').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'broadcastGameState').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'recordPlayerAnswer').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'updatePlayerScore').mockResolvedValue()
    vi.spyOn(gameFlowManager['gameStateSync'], 'getQuestionAnswers').mockResolvedValue([])
    vi.spyOn(gameFlowManager['gameStateSync'], 'cleanup').mockResolvedValue()

    await gameFlowManager.initialize()
  })

  afterEach(async () => {
    await gameFlowManager.cleanup()
  })

  describe('Complete Game Flow', () => {
    it('should execute complete game flow from start to finish', async () => {
      // 1. Start the game
      await gameFlowManager.startGame(mockQuestions)
      
      expect(gameFlowManager['gameStateSync'].updateSessionStatus).toHaveBeenCalledWith('active')
      expect(gameFlowManager['gameStateSync'].updateCurrentQuestion).toHaveBeenCalledWith('q1')
      expect(gameFlowManager['gameStateSync'].broadcastQuestionChange).toHaveBeenCalledWith(
        mockQuestions[0],
        5
      )
      expect(gameFlowManager.getCurrentPhase()).toBe('question')
      expect(gameFlowManager.getCurrentQuestionIndex()).toBe(0)

      // 2. Submit answers for first question
      const answer1Result = await gameFlowManager.submitAnswer(
        'player1',
        'q1',
        'Paris', // Correct answer
        'Paris',
        3
      )
      
      expect(answer1Result.isCorrect).toBe(true)
      expect(answer1Result.pointsEarned).toBeGreaterThan(0)
      expect(gameFlowManager['gameStateSync'].recordPlayerAnswer).toHaveBeenCalledWith(
        'player1',
        'q1',
        'Paris',
        true
      )

      const answer2Result = await gameFlowManager.submitAnswer(
        'player2',
        'q1',
        'London', // Incorrect answer
        'Paris',
        2
      )
      
      expect(answer2Result.isCorrect).toBe(false)
      expect(answer2Result.pointsEarned).toBe(0)

      // 3. Reveal answers for first question
      await gameFlowManager.revealAnswer(mockQuestions[0], {
        player1: 'Paris',
        player2: 'London'
      })
      
      expect(gameFlowManager['gameStateSync'].broadcastAnswerReveal).toHaveBeenCalledWith(
        'q1',
        'Paris',
        'Paris is the capital and largest city of France.'
      )
      expect(gameFlowManager.getCurrentPhase()).toBe('results')

      // 4. Advance to next question
      await gameFlowManager.nextQuestion(mockQuestions)
      
      expect(gameFlowManager['gameStateSync'].updateCurrentQuestion).toHaveBeenCalledWith('q2')
      expect(gameFlowManager['gameStateSync'].broadcastQuestionChange).toHaveBeenCalledWith(
        mockQuestions[1],
        5
      )
      expect(gameFlowManager.getCurrentPhase()).toBe('question')
      expect(gameFlowManager.getCurrentQuestionIndex()).toBe(1)

      // 5. Submit answers for second question
      await gameFlowManager.submitAnswer('player1', 'q2', '4', '4', 4)
      await gameFlowManager.submitAnswer('player2', 'q2', '4', '4', 3)

      // 6. Reveal answers for second question
      await gameFlowManager.revealAnswer(mockQuestions[1], {
        player1: '4',
        player2: '4'
      })

      // 7. Complete the game (no more questions)
      await gameFlowManager.nextQuestion(mockQuestions)
      
      expect(gameFlowManager['gameStateSync'].updateSessionStatus).toHaveBeenCalledWith('completed')
      expect(gameFlowManager['gameStateSync'].broadcastGameComplete).toHaveBeenCalled()
      expect(gameFlowManager.getCurrentPhase()).toBe('complete')
    })

    it('should handle game restart correctly', async () => {
      // Start and play through part of a game
      await gameFlowManager.startGame(mockQuestions)
      await gameFlowManager.submitAnswer('player1', 'q1', 'Paris', 'Paris', 3)
      
      // Restart the game
      await gameFlowManager.restartGame()
      
      expect(gameFlowManager['gameStateSync'].updateSessionStatus).toHaveBeenCalledWith('waiting')
      expect(gameFlowManager['gameStateSync'].updateCurrentQuestion).toHaveBeenCalledWith(null)
      expect(gameFlowManager.getCurrentPhase()).toBe('waiting')
      expect(gameFlowManager.getCurrentQuestionIndex()).toBe(0)
      
      // Verify player scores are reset
      expect(gameFlowManager['gameStateSync'].updatePlayerScore).toHaveBeenCalledWith('player1', 0)
      expect(gameFlowManager['gameStateSync'].updatePlayerScore).toHaveBeenCalledWith('player2', 0)
    })

    it('should handle force next question during active question', async () => {
      // Mock fetch for quiz API call
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quiz: { questions: mockQuestions } })
      } as Response)

      await gameFlowManager.startGame(mockQuestions)
      
      // Submit one answer but not all
      await gameFlowManager.submitAnswer('player1', 'q1', 'Paris', 'Paris', 3)
      
      // Force next question while still in question phase
      await gameFlowManager.forceNextQuestion(mockQuestions)
      
      // Should reveal answers first, then advance
      expect(gameFlowManager['gameStateSync'].broadcastAnswerReveal).toHaveBeenCalled()
      expect(gameFlowManager.getCurrentPhase()).toBe('results')
    })

    it('should handle empty questions array', async () => {
      await expect(gameFlowManager.startGame([])).rejects.toThrow('Cannot start game with no questions')
    })

    it('should calculate scores correctly based on time remaining', async () => {
      await gameFlowManager.startGame(mockQuestions)
      
      // Quick answer should get more points
      const quickAnswer = await gameFlowManager.submitAnswer('player1', 'q1', 'Paris', 'Paris', 4)
      
      // Slow answer should get fewer points
      const slowAnswer = await gameFlowManager.submitAnswer('player2', 'q1', 'Paris', 'Paris', 1)
      
      expect(quickAnswer.pointsEarned).toBeGreaterThan(slowAnswer.pointsEarned)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.spyOn(gameFlowManager['gameStateSync'], 'updateSessionStatus')
        .mockRejectedValueOnce(new Error('Database error'))
      
      await expect(gameFlowManager.startGame(mockQuestions)).rejects.toThrow('Database error')
    })

    it('should handle missing game state', async () => {
      vi.spyOn(gameFlowManager['gameStateSync'], 'getCurrentGameState')
        .mockResolvedValueOnce(null)
      
      // Should handle gracefully without throwing
      await gameFlowManager.submitAnswer('player1', 'q1', 'Paris', 'Paris', 3)
      
      // Verify it doesn't crash
      expect(true).toBe(true)
    })
  })

  describe('Real-time Synchronization', () => {
    it('should broadcast all game state changes', async () => {
      await gameFlowManager.startGame(mockQuestions)
      
      // Verify question broadcast
      expect(gameFlowManager['gameStateSync'].broadcastQuestionChange).toHaveBeenCalledWith(
        mockQuestions[0],
        5
      )
      
      // Submit answer and verify broadcast
      await gameFlowManager.submitAnswer('player1', 'q1', 'Paris', 'Paris', 3)
      
      expect(gameFlowManager['gameStateSync'].broadcastAnswerSubmitted).toHaveBeenCalledWith(
        expect.objectContaining({
          playerId: 'player1',
          questionId: 'q1',
          selectedAnswer: 'Paris',
          isCorrect: true
        })
      )
      
      // Reveal answer and verify broadcast
      await gameFlowManager.revealAnswer(mockQuestions[0], { player1: 'Paris' })
      
      expect(gameFlowManager['gameStateSync'].broadcastAnswerReveal).toHaveBeenCalledWith(
        'q1',
        'Paris',
        'Paris is the capital and largest city of France.'
      )
    })
  })
})