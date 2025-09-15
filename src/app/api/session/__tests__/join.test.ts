import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../join/route'
import { NextRequest } from 'next/server'
import * as database from '@/lib/database'

// Mock the database functions
vi.mock('@/lib/database', () => ({
  getSessionByJoinCode: vi.fn(),
  getSessionById: vi.fn(),
  createPlayer: vi.fn(),
  getPlayersBySessionId: vi.fn()
}))

// Mock crypto
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>()
  return {
    ...actual,
    randomUUID: vi.fn(() => 'mock-uuid-token')
  }
})

const mockGetSessionByJoinCode = vi.mocked(database.getSessionByJoinCode)
const mockGetSessionById = vi.mocked(database.getSessionById)
const mockCreatePlayer = vi.mocked(database.createPlayer)
const mockGetPlayersBySessionId = vi.mocked(database.getPlayersBySessionId)

describe('/api/session/join', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  interface JoinRequestBody {
    sessionId?: string
    joinCode?: string
    nickname?: string
  }

  const createRequest = (body: JoinRequestBody) => {
    return new NextRequest('http://localhost:3000/api/session/join', {
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

  const mockPlayer = {
    id: 'player-123',
    sessionId: '123e4567-e89b-12d3-a456-426614174001',
    nickname: 'TestPlayer',
    score: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  }

  it('should join session successfully with join code', async () => {
    mockGetSessionByJoinCode.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([])
    mockCreatePlayer.mockResolvedValue(mockPlayer)

    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.playerId).toBe('player-123')
    expect(data.sessionId).toBe('123e4567-e89b-12d3-a456-426614174001')
    expect(data.nickname).toBe('TestPlayer')
    expect(typeof data.playerToken).toBe('string')
    expect(data.playerToken.length).toBeGreaterThan(0)
    expect(mockGetSessionByJoinCode).toHaveBeenCalledWith('ABC123')
    expect(mockCreatePlayer).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001', 'TestPlayer')
  })

  it('should join session successfully with session ID', async () => {
    mockGetSessionById.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([])
    mockCreatePlayer.mockResolvedValue(mockPlayer)

    const request = createRequest({
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.playerId).toBe('player-123')
    expect(data.sessionId).toBe('123e4567-e89b-12d3-a456-426614174001')
    expect(data.nickname).toBe('TestPlayer')
    expect(typeof data.playerToken).toBe('string')
    expect(data.playerToken.length).toBeGreaterThan(0)
    expect(mockGetSessionById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174001')
  })

  it('should return 400 for invalid nickname', async () => {
    const request = createRequest({
      joinCode: 'ABC123',
      nickname: ''
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 400 for nickname with invalid characters', async () => {
    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'Test@Player!'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 400 for nickname too long', async () => {
    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'ThisNicknameIsWayTooLongForTheSystem'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 400 when neither sessionId nor joinCode provided', async () => {
    const request = createRequest({
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request data')
  })

  it('should return 404 when session not found', async () => {
    mockGetSessionByJoinCode.mockResolvedValue(null)

    const request = createRequest({
      joinCode: 'INVALID',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Session not found')
  })

  it('should return 400 when session is not accepting players', async () => {
    const activeSession = { ...mockSession, status: 'active' as const }
    mockGetSessionByJoinCode.mockResolvedValue(activeSession)

    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Session is no longer accepting players')
  })

  it('should return 409 when nickname is already taken', async () => {
    const existingPlayer = {
      id: 'existing-player',
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      nickname: 'TestPlayer',
      score: 0,
      joinedAt: '2024-01-01T00:00:00Z'
    }

    mockGetSessionByJoinCode.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([existingPlayer])

    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Nickname is already taken in this session')
  })

  it('should be case insensitive for nickname checking', async () => {
    const existingPlayer = {
      id: 'existing-player',
      sessionId: '123e4567-e89b-12d3-a456-426614174001',
      nickname: 'testplayer',
      score: 0,
      joinedAt: '2024-01-01T00:00:00Z'
    }

    mockGetSessionByJoinCode.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([existingPlayer])

    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toBe('Nickname is already taken in this session')
  })

  it('should return 500 when database operation fails', async () => {
    mockGetSessionByJoinCode.mockResolvedValue(mockSession)
    mockGetPlayersBySessionId.mockResolvedValue([])
    mockCreatePlayer.mockRejectedValue(new Error('Database error'))

    const request = createRequest({
      joinCode: 'ABC123',
      nickname: 'TestPlayer'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to join session')
  })
})