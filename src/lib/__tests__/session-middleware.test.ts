import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import {
  validateSession,
  validateHostAuthorization,
  validatePlayerAuthorization,
  validateSessionStatus,
  extractAuthHeaders,
  validateSessionAndAuth
} from '../session-middleware'
import * as database from '../database'

// Mock the database functions
vi.mock('../database', () => ({
  getSessionById: vi.fn(),
  getPlayersBySessionId: vi.fn()
}))

const mockGetSessionById = vi.mocked(database.getSessionById)
const mockGetPlayersBySessionId = vi.mocked(database.getPlayersBySessionId)

describe('Session Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockSession = {
    id: 'session-123',
    quizId: 'quiz-123',
    hostId: 'host-123',
    joinCode: 'ABC123',
    status: 'waiting' as const,
    createdAt: '2024-01-01T00:00:00Z'
  }

  const mockPlayers = [
    {
      id: 'player-1',
      sessionId: 'session-123',
      nickname: 'Player1',
      score: 0,
      joinedAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'player-2',
      sessionId: 'session-123',
      nickname: 'Player2',
      score: 0,
      joinedAt: '2024-01-01T00:00:00Z'
    }
  ]

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      mockGetSessionById.mockResolvedValue(mockSession)
      mockGetPlayersBySessionId.mockResolvedValue(mockPlayers)

      const result = await validateSession('session-123')

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockSession)
      expect(result.players).toEqual(mockPlayers)
    })

    it('should return error when session not found', async () => {
      mockGetSessionById.mockResolvedValue(null)

      const result = await validateSession('session-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
      expect(result.statusCode).toBe(404)
    })

    it('should return error when database fails', async () => {
      mockGetSessionById.mockRejectedValue(new Error('Database error'))

      const result = await validateSession('session-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to validate session')
      expect(result.statusCode).toBe(500)
    })
  })

  describe('validateHostAuthorization', () => {
    const context = {
      session: mockSession,
      players: mockPlayers
    }

    it('should authorize valid host', () => {
      const result = validateHostAuthorization(context, 'host-123')

      expect(result.authorized).toBe(true)
    })

    it('should reject invalid host', () => {
      const result = validateHostAuthorization(context, 'different-host')

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Unauthorized: Only the host can perform this action')
      expect(result.statusCode).toBe(403)
    })
  })

  describe('validatePlayerAuthorization', () => {
    const context = {
      session: mockSession,
      players: mockPlayers
    }

    it('should authorize valid player', () => {
      const result = validatePlayerAuthorization(context, 'player-1')

      expect(result.authorized).toBe(true)
      expect(result.player).toEqual(mockPlayers[0])
    })

    it('should reject invalid player', () => {
      const result = validatePlayerAuthorization(context, 'invalid-player')

      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Unauthorized: Player not found in session')
      expect(result.statusCode).toBe(403)
    })
  })

  describe('validateSessionStatus', () => {
    it('should validate correct single status', () => {
      const result = validateSessionStatus(mockSession, 'waiting')

      expect(result.valid).toBe(true)
    })

    it('should validate correct multiple statuses', () => {
      const result = validateSessionStatus(mockSession, ['waiting', 'active'])

      expect(result.valid).toBe(true)
    })

    it('should reject incorrect status', () => {
      const result = validateSessionStatus(mockSession, 'active')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Session must be in active status')
      expect(result.statusCode).toBe(400)
    })

    it('should reject incorrect multiple statuses', () => {
      const result = validateSessionStatus(mockSession, ['active', 'completed'])

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Session must be in active or completed status')
      expect(result.statusCode).toBe(400)
    })
  })

  describe('extractAuthHeaders', () => {
    it('should extract all auth headers', () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: {
          'x-host-id': 'host-123',
          'x-player-id': 'player-123',
          'x-player-token': 'token-123'
        }
      })

      const result = extractAuthHeaders(request)

      expect(result).toEqual({
        hostId: 'host-123',
        playerId: 'player-123',
        playerToken: 'token-123'
      })
    })

    it('should handle missing headers', () => {
      const request = new NextRequest('http://localhost:3000/api/test')

      const result = extractAuthHeaders(request)

      expect(result).toEqual({
        hostId: undefined,
        playerId: undefined,
        playerToken: undefined
      })
    })
  })

  describe('validateSessionAndAuth', () => {
    beforeEach(() => {
      mockGetSessionById.mockResolvedValue(mockSession)
      mockGetPlayersBySessionId.mockResolvedValue(mockPlayers)
    })

    it('should validate session without auth requirements', async () => {
      const result = await validateSessionAndAuth('session-123', {})

      expect(result.success).toBe(true)
      expect(result.context?.session).toEqual(mockSession)
      expect(result.context?.players).toEqual(mockPlayers)
    })

    it('should validate session with host auth', async () => {
      const result = await validateSessionAndAuth('session-123', {
        requireHost: true,
        hostId: 'host-123'
      })

      expect(result.success).toBe(true)
    })

    it('should validate session with player auth', async () => {
      const result = await validateSessionAndAuth('session-123', {
        requirePlayer: true,
        playerId: 'player-1'
      })

      expect(result.success).toBe(true)
      expect(result.player).toEqual(mockPlayers[0])
    })

    it('should validate session with status requirement', async () => {
      const result = await validateSessionAndAuth('session-123', {
        expectedStatus: 'waiting'
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid host auth', async () => {
      const result = await validateSessionAndAuth('session-123', {
        requireHost: true,
        hostId: 'wrong-host'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: Only the host can perform this action')
      expect(result.statusCode).toBe(403)
    })

    it('should reject invalid player auth', async () => {
      const result = await validateSessionAndAuth('session-123', {
        requirePlayer: true,
        playerId: 'wrong-player'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: Player not found in session')
      expect(result.statusCode).toBe(403)
    })

    it('should reject invalid status', async () => {
      const result = await validateSessionAndAuth('session-123', {
        expectedStatus: 'active'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session must be in active status')
      expect(result.statusCode).toBe(400)
    })

    it('should handle session not found', async () => {
      mockGetSessionById.mockResolvedValue(null)

      const result = await validateSessionAndAuth('session-123', {})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
      expect(result.statusCode).toBe(404)
    })
  })
})