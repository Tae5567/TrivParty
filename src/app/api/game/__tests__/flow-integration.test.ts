import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { POST } from '../flow/route'
import { NextRequest } from 'next/server'

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key'
  }
}))

// Mock dependencies
vi.mock('@/lib/game-flow-manager')
vi.mock('@/lib/database')
vi.mock('@/lib/supabase', () => ({
  createClientComponentClient: () => ({
    channel: vi.fn(() => ({
      subscribe: vi.fn(),
      send: vi.fn(),
      on: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })
}))

const mockGameFlowManager = {
  initialize: vi.fn(),
  startGame: vi.fn(),
  nextQuestion: vi.fn(),
  revealAnswer: vi.fn(),
  completeGame: vi.fn(),
  restartGame: vi.fn(),
  cleanup: vi.fn(),
  gameStateSync: {
    getCurrentGameState: vi.fn()
  }
}

const mockGetQuizById = vi.fn()

beforeAll(async () => {
  const gameFlowModule = await import('@/lib/game-flow-manager')
  const databaseModule = await import('@/lib/database')
  
  vi.mocked(gameFlowModule.GameFlowManager).mockImplementation(() => mockGameFlowManager)
  vi.mocked(databaseModule.getQuizById).mockImplementation(mockGetQuizById)
})

describe('Game Flow API Integration', () => {
  const mockGameState = {
    session: {
      id: 'session1',
      quizId: 'quiz1',
      hostId: 'host1',
      joinCode: 'ABC123',
      status: 'waiting' as const,
      createdAt: new Date().toISOString()
    },
    players: [
      {
        id: 'player1',
        sessionId: 'session1',
        nickname: 'Alice',
        score: 0,
        joinedAt: new Date().toISOString()
      }
    ],
    showResults: false
  }

  const mockQuiz = {
    id: 'quiz1',
    sourceUrl: 'https://example.com',
    title: 'Test Quiz',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        quizId: 'quiz1',
        text: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'A is correct',
        questionOrder: 1
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGameFlowManager.gameStateSync.getCurrentGameState.mockResolvedValue(mockGameState)
    mockGetQuizById.mockResolvedValue(mockQuiz)
  })

  describe('POST /api/game/flow', () => {
    it('should start a game successfully', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Game started successfully')
      expect(data.questionCount).toBe(1)
      expect(mockGameFlowManager.startGame).toHaveBeenCalledWith(mockQuiz.questions)
    })

    it('should advance to next question', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'next',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Advanced to next question')
      expect(mockGameFlowManager.nextQuestion).toHaveBeenCalledWith(mockQuiz.questions)
    })

    it('should reveal answer with correct details', async () => {
      const playerAnswers = { player1: 'A', player2: 'B' }
      
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reveal',
          sessionId: 'session1',
          hostId: 'host1',
          questionId: 'q1',
          playerAnswers
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Answer revealed')
      expect(data.correctAnswer).toBe('A')
      expect(data.explanation).toBe('A is correct')
      expect(mockGameFlowManager.revealAnswer).toHaveBeenCalledWith(
        mockQuiz.questions[0],
        playerAnswers
      )
    })

    it('should complete game successfully', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'complete',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Game completed')
      expect(mockGameFlowManager.completeGame).toHaveBeenCalled()
    })

    it('should restart game successfully', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'restart',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Game restarted')
      expect(mockGameFlowManager.restartGame).toHaveBeenCalled()
    })

    it('should reject unauthorized requests', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          sessionId: 'session1',
          hostId: 'wrong-host'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized: Only the host can control game flow')
    })

    it('should validate request body', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid-action',
          sessionId: 'session1'
          // Missing hostId
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should handle missing quiz', async () => {
      mockGetQuizById.mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Quiz not found or has no questions')
    })

    it('should handle missing question for reveal', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reveal',
          sessionId: 'session1',
          hostId: 'host1'
          // Missing questionId
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle question not found for reveal', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reveal',
          sessionId: 'session1',
          hostId: 'host1',
          questionId: 'non-existent-question'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Question not found')
    })

    it('should handle server errors gracefully', async () => {
      mockGameFlowManager.initialize.mockRejectedValueOnce(new Error('Server error'))

      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to execute game flow action')
    })

    it('should clean up resources after each request', async () => {
      const request = new NextRequest('http://localhost/api/game/flow', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          sessionId: 'session1',
          hostId: 'host1'
        })
      })

      await POST(request)

      expect(mockGameFlowManager.cleanup).toHaveBeenCalled()
    })
  })
})