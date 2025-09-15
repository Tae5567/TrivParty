import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../start/route'
import { NextRequest } from 'next/server'
import * as database from '@/lib/database'

// Mock the database functions
vi.mock('@/lib/database', () => ({
  getSessionById: vi.fn(),
  updateSessionStatus: vi.fn(),
  getPlayersBySessionId: vi.fn(),
  getQuizById: vi.fn()
}))

const mockGetSessionById = vi.mocked(database.getSessionById)
const mockUpdateSessionStatus = vi.mocked(database.updateSessionStatus)
const mockGetPlayersBySessionId = vi.mocked(database.getPlayersBySessionId)
const mockGetQuizById = vi.mocked(database.getQuizById)

describe('/api/session/start', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  const mockSession = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    quizId: '123e4567-e89b-12d3-a456-426614174000',
    hostId: 'host-123',
    joinCode: 'ABC123',
    status: 'waiting' as const,
    createdAt: '2024-01-01T00:00:00Z'
  }

  const mockPlayers = [
    {
      id: 'player-1',
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      nickname: 'Player1',
      score: 0,
      joinedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'player-2',
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      nickname: 'Player2',
      score: 0,
      joinedAt: '2024-01-01T00:00:00Z'
    }
  ]

  const mockQuiz = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    sourceUrl: 'https://example.com',
    title: 'Test Quiz',
    createdAt: '2024-01-01T00:00:00Z',
    questions: [
      {
        id: 'q1',
        quizId: '123e4567-e89b-12d3-a456-426614174000',
        text: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Test explanation',
        questionOrder: 1
      }
    ]
  }

  it('should start session successfully', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue(mockPlayers)
    mockGetQuizById.mockResolvedValue(mockQuiz)
    mockUpdateSessionStatus.mockResolvedValue()

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      success: true,
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      playerCount: 2,
      questionCount: 1
    })
    expect(mockUpdateSessionStatus).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001', 'active')
  })

  it('should return 400 for invalid session ID format', async () => {
    const request = createRequest({
      sessionId: 'invalid-uuid',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 400 for missing hostId', async () => {
    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174000'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 404 when session not found', async () => {
    mockGetSessionById.mockResolvedValue(null)

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Session not found')
  })

  it('should return 403 when user is not the host', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'different-host'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Unauthorized: Only the host can start the session')
  })

  it('should return 400 when session is not in waiting status', async () => {
    const activeSession = { ...mockSession, status: 'active' as const }
    mockGetSessionById.mockResolvedValue(activeSession)

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Session cannot be started in current state')
  })

  it('should return 400 when no players in session', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([])

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Cannot start session with no players')
  })

  it('should return 400 when quiz not found', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue(mockPlayers)
    mockGetQuizById.mockResolvedValue(null)

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Quiz not found or has no questions')
  })

  it('should return 400 when quiz has no questions', async () => {
    const quizWithoutQuestions = { ...mockQuiz, questions: [] }
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue(mockPlayers)
    mockGetQuizById.mockResolvedValue(quizWithoutQuestions)

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Quiz not found or has no questions')
  })

  it('should return 500 when database operation fails', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue(mockPlayers)
    mockGetQuizById.mockResolvedValue(mockQuiz)
    mockUpdateSessionStatus.mockRejectedValue(new Error('Database error'))

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to start session')
  })
})