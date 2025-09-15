import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../create/route'
import { NextRequest } from 'next/server'
import * as database from '@/lib/database'

// Mock the database functions
vi.mock('@/lib/database', () => ({
  createSession: vi.fn(),
  getQuizById: vi.fn()
}))

const mockCreateSession = vi.mocked(database.createSession)
const mockGetQuizById = vi.mocked(database.getQuizById)

describe('/api/session/create', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  it('should create a session successfully', async () => {
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

    const mockSession = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123',
      joinCode: 'ABC123',
      status: 'waiting' as const,
      createdAt: '2024-01-01T00:00:00Z'
    }

    mockGetQuizById.mockResolvedValue(mockQuiz)
    mockCreateSession.mockResolvedValue(mockSession)

    const request = createRequest({
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      joinCode: 'ABC123'
    })
    expect(mockGetQuizById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    expect(mockCreateSession).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'host-123')
  })

  it('should return 400 for invalid quiz ID format', async () => {
    const request = createRequest({
      quizId: 'invalid-uuid',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
    expect(data.details).toBeDefined()
  })

  it('should return 400 for missing hostId', async () => {
    const request = createRequest({
      quizId: '123e4567-e89b-12d3-a456-426614174000'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 404 when quiz not found', async () => {
    mockGetQuizById.mockResolvedValue(null)

    const request = createRequest({
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Quiz not found')
  })

  it('should return 400 when quiz has no questions', async () => {
    const mockQuiz = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      sourceUrl: 'https://example.com',
      title: 'Test Quiz',
      createdAt: '2024-01-01T00:00:00Z',
      questions: []
    }

    mockGetQuizById.mockResolvedValue(mockQuiz)

    const request = createRequest({
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Quiz has no questions')
  })

  it('should return 500 when database operation fails', async () => {
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

    mockGetQuizById.mockResolvedValue(mockQuiz)
    mockCreateSession.mockRejectedValue(new Error('Database error'))

    const request = createRequest({
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create session')
  })
})