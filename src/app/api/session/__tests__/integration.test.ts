import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as createSession } from '../create/route'
import { POST as joinSession } from '../join/route'
import { POST as startSession } from '../start/route'
import { NextRequest } from 'next/server'
import * as database from '@/lib/database'

// Mock the database functions
vi.mock('@/lib/database', () => ({
  createSession: vi.fn(),
  getQuizById: vi.fn(),
  getSessionByJoinCode: vi.fn(),
  getSessionById: vi.fn(),
  createPlayer: vi.fn(),
  getPlayersBySessionId: vi.fn(),
  updateSessionStatus: vi.fn()
}))

const mockCreateSession = vi.mocked(database.createSession)
const mockGetQuizById = vi.mocked(database.getQuizById)
const mockGetSessionByJoinCode = vi.mocked(database.getSessionByJoinCode)
const mockGetSessionById = vi.mocked(database.getSessionById)
const mockCreatePlayer = vi.mocked(database.createPlayer)
const mockGetPlayersBySessionId = vi.mocked(database.getPlayersBySessionId)
const mockUpdateSessionStatus = vi.mocked(database.updateSessionStatus)

describe('Session Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (url: string, body: any) => {
    return new NextRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

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

  const mockPlayer1 = {
    id: 'player-1',
    sessionId: '123e4567-e89b-12d3-a456-426614174001',
    nickname: 'Player1',
    score: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  }

  const mockPlayer2 = {
    id: 'player-2',
    sessionId: '123e4567-e89b-12d3-a456-426614174001',
    nickname: 'Player2',
    score: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  }

  it('should complete full session flow: create -> join -> start', async () => {
    // Step 1: Create session
    mockGetQuizById.mockResolvedValue(mockQuiz)
    mockCreateSession.mockResolvedValue(mockSession)

    const createRequest1 = createRequest('http://localhost:3000/api/session/create', {
      quizId: '123e4567-e89b-12d3-a456-426614174000',
      hostId: 'host-123'
    })

    const createResponse = await createSession(createRequest1)
    const createData = await createResponse.json()

    expect(createResponse.status).toBe(200)
    expect(createData.sessionId).toBe('123e4567-e89b-12d3-a456-426614174001')
    expect(createData.joinCode).toBe('ABC123')

    // Step 2: First player joins
    mockGetSessionByJoinCode.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValueOnce([]) // No existing players
    mockCreatePlayer.mockResolvedValueOnce(mockPlayer1)

    const joinRequest1 = createRequest('http://localhost:3000/api/session/join', {
      joinCode: 'ABC123',
      nickname: 'Player1'
    })

    const joinResponse1 = await joinSession(joinRequest1)
    const joinData1 = await joinResponse1.json()

    expect(joinResponse1.status).toBe(200)
    expect(joinData1.playerId).toBe('player-1')
    expect(joinData1.nickname).toBe('Player1')

    // Step 3: Second player joins
    mockGetPlayersBySessionId.mockResolvedValueOnce([mockPlayer1]) // Player1 already exists
    mockCreatePlayer.mockResolvedValueOnce(mockPlayer2)

    const joinRequest2 = createRequest('http://localhost:3000/api/session/join', {
      joinCode: 'ABC123',
      nickname: 'Player2'
    })

    const joinResponse2 = await joinSession(joinRequest2)
    const joinData2 = await joinResponse2.json()

    expect(joinResponse2.status).toBe(200)
    expect(joinData2.playerId).toBe('player-2')
    expect(joinData2.nickname).toBe('Player2')

    // Step 4: Host starts the session
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([mockPlayer1, mockPlayer2])
    mockGetQuizById.mockResolvedValue(mockQuiz)
    mockUpdateSessionStatus.mockResolvedValue()

    const startRequest1 = createRequest('http://localhost:3000/api/session/start', {
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const startResponse = await startSession(startRequest1)
    const startData = await startResponse.json()

    expect(startResponse.status).toBe(200)
    expect(startData.success).toBe(true)
    expect(startData.playerCount).toBe(2)
    expect(startData.questionCount).toBe(1)

    // Verify all database calls were made correctly
    expect(mockCreateSession).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', 'host-123')
    expect(mockCreatePlayer).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001', 'Player1')
    expect(mockCreatePlayer).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001', 'Player2')
    expect(mockUpdateSessionStatus).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001', 'active')
  })

  it('should prevent duplicate nicknames in same session', async () => {
    mockGetSessionByJoinCode.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([mockPlayer1]) // Player1 already exists
    
    const joinRequest = createRequest('http://localhost:3000/api/session/join', {
      joinCode: 'ABC123',
      nickname: 'Player1' // Same nickname as existing player
    })

    const joinResponse = await joinSession(joinRequest)
    const joinData = await joinResponse.json()

    expect(joinResponse.status).toBe(409)
    expect(joinData.error).toBe('Nickname is already taken in this session')
  })

  it('should prevent non-host from starting session', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)

    const startRequest = createRequest('http://localhost:3000/api/session/start', {
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'different-host' // Not the actual host
    })

    const startResponse = await startSession(startRequest)
    const startData = await startResponse.json()

    expect(startResponse.status).toBe(403)
    expect(startData.error).toBe('Unauthorized: Only the host can start the session')
  })

  it('should prevent starting session with no players', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([]) // No players

    const startRequest = createRequest('http://localhost:3000/api/session/start', {
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      hostId: 'host-123'
    })

    const startResponse = await startSession(startRequest)
    const startData = await startResponse.json()

    expect(startResponse.status).toBe(400)
    expect(startData.error).toBe('Cannot start session with no players')
  })
})