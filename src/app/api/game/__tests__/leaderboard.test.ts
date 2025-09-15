import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../leaderboard/route'
import { getSessionLeaderboard } from '@/lib/scoring'

// Mock the dependencies
vi.mock('@/lib/scoring')
vi.mock('@/lib/supabase', () => ({
  supabase: {}
}))

const mockGetSessionLeaderboard = vi.mocked(getSessionLeaderboard)

describe('/api/game/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return leaderboard for valid session', async () => {
    const mockLeaderboard = [
      {
        id: 'player-1',
        sessionId: 'session-1',
        nickname: 'Alice',
        score: 200,
        joinedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'player-2',
        sessionId: 'session-1',
        nickname: 'Bob',
        score: 150,
        joinedAt: '2024-01-01T00:01:00Z'
      }
    ]

    mockGetSessionLeaderboard.mockResolvedValue(mockLeaderboard)

    const request = new Request('http://localhost:3000/api/game/leaderboard?sessionId=session-1')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.leaderboard).toEqual(mockLeaderboard)

    expect(mockGetSessionLeaderboard).toHaveBeenCalledWith('session-1')
  })

  it('should return 400 for missing session ID', async () => {
    const request = new Request('http://localhost:3000/api/game/leaderboard')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Session ID is required')
  })

  it('should handle database errors', async () => {
    mockGetSessionLeaderboard.mockRejectedValue(new Error('Database error'))

    const request = new Request('http://localhost:3000/api/game/leaderboard?sessionId=session-1')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch leaderboard')
  })
})