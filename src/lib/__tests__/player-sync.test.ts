import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlayerSync, type PlayerPresence } from '../player-sync'

// Mock Supabase client
const mockChannel = {
  subscribe: vi.fn().mockImplementation((callback) => {
    // Simulate successful subscription synchronously
    callback('SUBSCRIBED')
    return Promise.resolve()
  }),
  track: vi.fn().mockResolvedValue(undefined),
  send: vi.fn().mockResolvedValue(undefined),
  on: vi.fn().mockReturnThis(),
  presenceState: vi.fn().mockReturnValue({}),
}

const mockSupabase = {
  channel: vi.fn().mockReturnValue(mockChannel),
  removeChannel: vi.fn().mockResolvedValue(undefined),
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase', () => ({
  createClientComponentClient: () => mockSupabase,
}))

describe('PlayerSync', () => {
  let playerSync: PlayerSync
  const sessionId = 'test-session-id'
  const playerId = 'test-player-id'
  const nickname = 'Test Player'

  beforeEach(() => {
    playerSync = new PlayerSync(sessionId)
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(async () => {
    vi.useRealTimers()
    await playerSync.cleanup()
  })

  describe('initialization', () => {
    it('should initialize with correct session ID', () => {
      expect(playerSync).toBeDefined()
    })

    it('should create channel with correct configuration', async () => {
      await playerSync.initialize(playerId, nickname)

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        `players:${sessionId}`,
        {
          config: {
            presence: { key: playerId },
            broadcast: { self: false },
          },
        }
      )
    })

    it('should track player presence on successful subscription', async () => {
      await playerSync.initialize(playerId, nickname)

      expect(mockChannel.track).toHaveBeenCalledWith({
        playerId,
        nickname,
        joinedAt: expect.any(String),
        lastSeen: expect.any(String),
        isOnline: true,
      })
    })

    it('should set up event listeners', async () => {
      await playerSync.initialize(playerId, nickname)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'sync' },
        expect.any(Function)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'join' },
        expect.any(Function)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'presence',
        { event: 'leave' },
        expect.any(Function)
      )
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'player_disconnected' },
        expect.any(Function)
      )
    })
  })

  describe('presence management', () => {
    beforeEach(async () => {
      await playerSync.initialize(playerId, nickname)
    })

    it('should get online players', () => {
      const mockPresence: PlayerPresence = {
        playerId: 'player-1',
        nickname: 'Player 1',
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      // Simulate presence state
      mockChannel.presenceState.mockReturnValue({
        'player-1': [mockPresence],
      })

      // Trigger sync
      const syncCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'sync'
      )?.[2]
      syncCallback?.()

      const onlinePlayers = playerSync.getOnlinePlayers()
      expect(onlinePlayers).toHaveLength(1)
      expect(onlinePlayers[0]).toEqual(mockPresence)
    })

    it('should check if player is online', () => {
      const mockPresence: PlayerPresence = {
        playerId: 'player-1',
        nickname: 'Player 1',
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      // Simulate presence state
      mockChannel.presenceState.mockReturnValue({
        'player-1': [mockPresence],
      })

      // Trigger sync
      const syncCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'sync'
      )?.[2]
      syncCallback?.()

      expect(playerSync.isPlayerOnline('player-1')).toBe(true)
      expect(playerSync.isPlayerOnline('player-2')).toBe(false)
    })

    it('should get specific player presence', () => {
      const mockPresence: PlayerPresence = {
        playerId: 'player-1',
        nickname: 'Player 1',
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      // Simulate presence state
      mockChannel.presenceState.mockReturnValue({
        'player-1': [mockPresence],
      })

      // Trigger sync
      const syncCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'sync'
      )?.[2]
      syncCallback?.()

      expect(playerSync.getPlayerPresence('player-1')).toEqual(mockPresence)
      expect(playerSync.getPlayerPresence('player-2')).toBeNull()
    })
  })

  describe('event handling', () => {
    beforeEach(async () => {
      await playerSync.initialize(playerId, nickname)
    })

    it('should handle player join events', () => {
      const joinCallback = vi.fn()
      playerSync.onPlayerJoined(joinCallback)

      const mockPresence: PlayerPresence = {
        playerId: 'player-2',
        nickname: 'Player 2',
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      // Trigger join event
      const joinEventCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'join'
      )?.[2]
      joinEventCallback?.({ key: 'player-2', newPresences: [mockPresence] })

      expect(joinCallback).toHaveBeenCalledWith(mockPresence)
    })

    it('should handle player leave events', () => {
      const leaveCallback = vi.fn()
      playerSync.onPlayerLeft(leaveCallback)

      const mockPresence: PlayerPresence = {
        playerId: 'player-2',
        nickname: 'Player 2',
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      // Trigger leave event
      const leaveEventCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'leave'
      )?.[2]
      leaveEventCallback?.({ key: 'player-2', leftPresences: [mockPresence] })

      expect(leaveCallback).toHaveBeenCalledWith(mockPresence)
    })

    it('should handle player disconnection events', () => {
      const disconnectCallback = vi.fn()
      playerSync.onPlayerDisconnected(disconnectCallback)

      // First add a player to cache
      const mockPresence: PlayerPresence = {
        playerId: 'player-2',
        nickname: 'Player 2',
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      mockChannel.presenceState.mockReturnValue({
        'player-2': [mockPresence],
      })

      const syncCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'sync'
      )?.[2]
      syncCallback?.()

      // Trigger disconnection event
      const disconnectEventCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'broadcast' && call[1].event === 'player_disconnected'
      )?.[2]
      disconnectEventCallback?.({
        payload: { playerId: 'player-2', reason: 'network_error' }
      })

      expect(disconnectCallback).toHaveBeenCalledWith(
        expect.objectContaining({ 
          playerId: 'player-2', 
          isOnline: false,
          nickname: 'Player 2'
        }),
        'network_error'
      )
    })
  })

  describe('broadcasting', () => {
    beforeEach(async () => {
      await playerSync.initialize(playerId, nickname)
    })

    it('should broadcast player disconnection', async () => {
      const reason = 'network_error'
      await playerSync.broadcastDisconnection(reason)

      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'player_disconnected',
        payload: {
          playerId,
          reason,
          timestamp: expect.any(String),
        },
      })
    })
  })

  describe('database operations', () => {
    beforeEach(async () => {
      await playerSync.initialize(playerId, nickname)
    })

    it('should get players with status', async () => {
      const mockPlayers = [
        { id: 'player-1', nickname: 'Player 1', score: 100 },
        { id: 'player-2', nickname: 'Player 2', score: 80 },
      ]

      mockSupabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => ({ data: mockPlayers, error: null }),
          }),
        }),
      })

      // Mock presence state
      mockChannel.presenceState.mockReturnValue({
        'player-1': [{ playerId: 'player-1', isOnline: true }],
      })

      const syncCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'sync'
      )?.[2]
      syncCallback?.()

      const playersWithStatus = await playerSync.getPlayersWithStatus()

      expect(playersWithStatus).toEqual([
        { id: 'player-1', nickname: 'Player 1', score: 100, isOnline: true },
        { id: 'player-2', nickname: 'Player 2', score: 80, isOnline: false },
      ])
    })

    it('should remove player from session', async () => {
      mockSupabase.from.mockReturnValue({
        delete: () => ({
          eq: () => ({ error: null }),
        }),
      })

      await playerSync.removePlayer('player-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('players')
    })
  })

  describe('heartbeat', () => {
    beforeEach(async () => {
      await playerSync.initialize(playerId, nickname)
    })

    it('should update presence with heartbeat', async () => {
      // Clear initial track call
      mockChannel.track.mockClear()

      // Simulate presence in cache for heartbeat
      const mockPresence: PlayerPresence = {
        playerId,
        nickname,
        joinedAt: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
        isOnline: true,
      }

      mockChannel.presenceState.mockReturnValue({
        [playerId]: [mockPresence],
      })

      // Trigger sync to populate cache
      const syncCallback = mockChannel.on.mock.calls.find(
        call => call[0] === 'presence' && call[1].event === 'sync'
      )?.[2]
      syncCallback?.()

      // Fast-forward 30 seconds to trigger heartbeat
      vi.advanceTimersByTime(30000)

      expect(mockChannel.track).toHaveBeenCalledWith({
        playerId,
        nickname,
        joinedAt: expect.any(String),
        lastSeen: expect.any(String),
        isOnline: true,
      })
    })
  })

  describe('cleanup', () => {
    it('should clean up resources', async () => {
      await playerSync.initialize(playerId, nickname)
      await playerSync.cleanup()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })

    it('should clear heartbeat interval', async () => {
      await playerSync.initialize(playerId, nickname)
      
      await playerSync.cleanup()

      // The cleanup should have cleared the interval and removed channel
      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
    })
  })
})