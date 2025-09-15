import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as createReplay } from '../create/route'
import { POST as generateReplay } from '../generate/route'
import { GET as getReplay } from '../[replayCode]/route'
import { POST as shareReplay } from '../share/route'

// Mock the replay service
const mockReplayService = {
  createReplay: vi.fn(),
  generateReplayFromSession: vi.fn(),
  getReplayByCode: vi.fn(),
  recordShare: vi.fn(),
  generateShareableUrl: vi.fn(),
  generateSocialShareUrls: vi.fn()
}

vi.mock('@/lib/replay', () => ({
  replayService: mockReplayService
}))

describe('Replay API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/replay/create', () => {
    it('should create replay successfully', async () => {
      const mockReplay = {
        id: 'replay-123',
        replayCode: 'ABC12345',
        title: 'Test Quiz Replay',
        shareUrl: 'https://example.com/replay/ABC12345'
      }

      mockReplayService.createReplay.mockResolvedValue(mockReplay)
      mockReplayService.generateShareableUrl.mockReturnValue(mockReplay.shareUrl)

      const request = new NextRequest('http://localhost/api/replay/create', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-123',
          title: 'Test Quiz Replay',
          quizTitle: 'Test Quiz',
          totalQuestions: 5,
          totalPlayers: 3,
          finalScores: [],
          questionResults: []
        })
      })

      const response = await createReplay(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.replay.replayCode).toBe('ABC12345')
      expect(mockReplayService.createReplay).toHaveBeenCalled()
    })

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/replay/create', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-123'
          // Missing other required fields
        })
      })

      const response = await createReplay(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should return 500 when replay creation fails', async () => {
      mockReplayService.createReplay.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/replay/create', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-123',
          title: 'Test Quiz Replay',
          quizTitle: 'Test Quiz',
          totalQuestions: 5,
          totalPlayers: 3,
          finalScores: [],
          questionResults: []
        })
      })

      const response = await createReplay(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create replay')
    })
  })

  describe('POST /api/replay/generate', () => {
    it('should generate replay from session successfully', async () => {
      const mockReplayData = {
        sessionId: 'session-123',
        title: 'Generated Replay',
        quizTitle: 'Test Quiz',
        totalQuestions: 5,
        totalPlayers: 3,
        finalScores: [],
        questionResults: []
      }

      const mockReplay = {
        id: 'replay-123',
        replayCode: 'ABC12345',
        title: 'Generated Replay'
      }

      mockReplayService.generateReplayFromSession.mockResolvedValue(mockReplayData)
      mockReplayService.createReplay.mockResolvedValue(mockReplay)
      mockReplayService.generateShareableUrl.mockReturnValue('https://example.com/replay/ABC12345')
      mockReplayService.generateSocialShareUrls.mockReturnValue({
        twitter: 'https://twitter.com/intent/tweet?...',
        facebook: 'https://facebook.com/sharer/...',
        linkedin: 'https://linkedin.com/sharing/...'
      })

      const request = new NextRequest('http://localhost/api/replay/generate', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'session-123' })
      })

      const response = await generateReplay(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.replay.replayCode).toBe('ABC12345')
      expect(data.replay.socialUrls).toBeDefined()
    })

    it('should return 400 for missing session ID', async () => {
      const request = new NextRequest('http://localhost/api/replay/generate', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await generateReplay(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Session ID is required')
    })

    it('should return 404 when session not found', async () => {
      mockReplayService.generateReplayFromSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/replay/generate', {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'invalid-session' })
      })

      const response = await generateReplay(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Failed to generate replay data from session')
    })
  })

  describe('GET /api/replay/[replayCode]', () => {
    it('should fetch replay successfully', async () => {
      const mockReplay = {
        id: 'replay-123',
        replayCode: 'ABC12345',
        title: 'Test Replay',
        finalScores: [],
        questionResults: []
      }

      mockReplayService.getReplayByCode.mockResolvedValue(mockReplay)

      const response = await getReplay(
        new NextRequest('http://localhost/api/replay/ABC12345'),
        { params: { replayCode: 'ABC12345' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.replay.replayCode).toBe('ABC12345')
      expect(mockReplayService.getReplayByCode).toHaveBeenCalledWith('ABC12345')
    })

    it('should return 404 for non-existent replay', async () => {
      mockReplayService.getReplayByCode.mockResolvedValue(null)

      const response = await getReplay(
        new NextRequest('http://localhost/api/replay/INVALID'),
        { params: { replayCode: 'INVALID' } }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Replay not found or expired')
    })
  })

  describe('POST /api/replay/share', () => {
    it('should record share successfully', async () => {
      mockReplayService.recordShare.mockResolvedValue(true)

      const request = new NextRequest('http://localhost/api/replay/share', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.1'
        },
        body: JSON.stringify({
          replayId: 'replay-123',
          platform: 'twitter'
        })
      })

      const response = await shareReplay(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockReplayService.recordShare).toHaveBeenCalledWith({
        replayId: 'replay-123',
        platform: 'twitter',
        sharedByIp: '192.168.1.1'
      })
    })

    it('should return 400 for missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/replay/share', {
        method: 'POST',
        body: JSON.stringify({
          replayId: 'replay-123'
          // Missing platform
        })
      })

      const response = await shareReplay(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Replay ID and platform are required')
    })

    it('should return 400 for invalid platform', async () => {
      const request = new NextRequest('http://localhost/api/replay/share', {
        method: 'POST',
        body: JSON.stringify({
          replayId: 'replay-123',
          platform: 'invalid-platform'
        })
      })

      const response = await shareReplay(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid platform')
    })

    it('should return 500 when share recording fails', async () => {
      mockReplayService.recordShare.mockResolvedValue(false)

      const request = new NextRequest('http://localhost/api/replay/share', {
        method: 'POST',
        body: JSON.stringify({
          replayId: 'replay-123',
          platform: 'twitter'
        })
      })

      const response = await shareReplay(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to record share')
    })
  })
})