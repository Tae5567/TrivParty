import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../submit-answer/route'
import { submitAnswerAndUpdateScore } from '@/lib/scoring'
import { GameStateSync } from '@/lib/game-state-sync'

// Mock the dependencies
vi.mock('@/lib/scoring')
vi.mock('@/lib/game-state-sync')
vi.mock('@/lib/supabase', () => ({
  supabase: {}
}))

const mockSubmitAnswerAndUpdateScore = vi.mocked(submitAnswerAndUpdateScore)
const mockGameStateSync = {
  initialize: vi.fn(),
  broadcastAnswerSubmitted: vi.fn()
}

vi.mocked(GameStateSync).mockImplementation(() => mockGameStateSync as any)

describe('/api/game/submit-answer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should submit answer and return success response', async () => {
    const mockResult = {
      answer: {
        id: 'answer-1',
        playerId: 'player-1',
        questionId: 'question-1',
        selectedAnswer: 'Option A',
        isCorrect: true,
        answeredAt: '2024-01-01T00:00:00Z'
      },
      newScore: 150,
      pointsEarned: 100
    }

    mockSubmitAnswerAndUpdateScore.mockResolvedValue(mockResult)

    const request = new Request('http://localhost:3000/api/game/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-1',
        questionId: 'question-1',
        selectedAnswer: 'Option A',
        correctAnswer: 'Option A',
        sessionId: 'session-1',
        timeRemaining: 25
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.isCorrect).toBe(true)
    expect(data.newScore).toBe(150)
    expect(data.pointsEarned).toBe(100)

    expect(mockSubmitAnswerAndUpdateScore).toHaveBeenCalledWith(
      'player-1',
      'question-1',
      'Option A',
      'Option A',
      25
    )

    expect(mockGameStateSync.initialize).toHaveBeenCalled()
    expect(mockGameStateSync.broadcastAnswerSubmitted).toHaveBeenCalledWith({
      playerId: 'player-1',
      questionId: 'question-1',
      selectedAnswer: 'Option A',
      isCorrect: true,
      pointsEarned: 100,
      newScore: 150,
      timestamp: expect.any(String)
    })
  })

  it('should return 400 for missing required fields', async () => {
    const request = new Request('http://localhost:3000/api/game/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-1'
        // Missing other required fields
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should handle scoring errors', async () => {
    mockSubmitAnswerAndUpdateScore.mockRejectedValue(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/game/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId: 'player-1',
        questionId: 'question-1',
        selectedAnswer: 'Option A',
        correctAnswer: 'Option A',
        sessionId: 'session-1'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to submit answer')
  })
})