import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePowerUps } from '../usePowerUps'
import type { PlayerPowerUp } from '@/types'

// Mock the power-ups library
vi.mock('@/lib/power-ups', () => ({
  getPlayerPowerUps: vi.fn(),
  usePowerUp: vi.fn(),
  initializePlayerPowerUps: vi.fn()
}))

describe('usePowerUps', () => {
  const mockPlayerPowerUps: PlayerPowerUp[] = [
    {
      id: 'player-power-up-1',
      playerId: 'player-1',
      powerUpId: 'power-up-1',
      usesRemaining: 1,
      createdAt: '2024-01-01T00:00:00Z',
      powerUp: {
        id: 'power-up-1',
        name: 'skip_question',
        description: 'Skip a difficult question without penalty',
        icon: 'SkipForward',
        maxUsesPerGame: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => usePowerUps())

    expect(result.current.powerUps).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should load power-ups when playerId is provided', async () => {
    const mockGetPlayerPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockGetPlayerPowerUps.getPlayerPowerUps).mockResolvedValue(mockPlayerPowerUps)

    const { result } = renderHook(() => usePowerUps({ playerId: 'player-1' }))

    await waitFor(() => {
      expect(result.current.powerUps).toEqual(mockPlayerPowerUps)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    }, { timeout: 100 })

    expect(mockGetPlayerPowerUps.getPlayerPowerUps).toHaveBeenCalledWith('player-1')
  })

  it('should handle loading state correctly', async () => {
    const mockGetPlayerPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockGetPlayerPowerUps.getPlayerPowerUps).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPlayerPowerUps), 10))
    )

    const { result } = renderHook(() => usePowerUps({ playerId: 'player-1' }))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 100 })
  })

  it('should handle errors when loading power-ups fails', async () => {
    const mockGetPlayerPowerUps = await import('@/lib/power-ups')
    const error = new Error('Failed to load power-ups')
    vi.mocked(mockGetPlayerPowerUps.getPlayerPowerUps).mockRejectedValue(error)

    const { result } = renderHook(() => usePowerUps({ playerId: 'player-1' }))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load power-ups')
      expect(result.current.loading).toBe(false)
    }, { timeout: 100 })
  })

  it('should initialize power-ups when autoInitialize is true', async () => {
    const mockPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockPowerUps.initializePlayerPowerUps).mockResolvedValue()
    vi.mocked(mockPowerUps.getPlayerPowerUps).mockResolvedValue(mockPlayerPowerUps)

    renderHook(() => usePowerUps({ 
      playerId: 'player-1', 
      autoInitialize: true 
    }))

    await waitFor(() => {
      expect(mockPowerUps.initializePlayerPowerUps).toHaveBeenCalledWith('player-1')
    }, { timeout: 100 })
  })

  it('should use power-up successfully', async () => {
    const mockPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockPowerUps.getPlayerPowerUps).mockResolvedValue(mockPlayerPowerUps)
    vi.mocked(mockPowerUps.usePowerUp).mockResolvedValue({ 
      success: true, 
      message: 'Power-up used successfully' 
    })

    const { result } = renderHook(() => usePowerUps({ 
      playerId: 'player-1',
      questionId: 'question-1'
    }))

    await waitFor(() => {
      expect(result.current.powerUps).toEqual(mockPlayerPowerUps)
    })

    let usageResult: any
    await act(async () => {
      usageResult = await result.current.usePowerUpAction('skip_question')
    })

    expect(usageResult).toEqual({ success: true, message: 'Power-up used successfully' })
    expect(mockPowerUps.usePowerUp).toHaveBeenCalledWith('player-1', 'skip_question', 'question-1')
  })

  it('should refresh power-ups after successful usage', async () => {
    const mockPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockPowerUps.getPlayerPowerUps)
      .mockResolvedValueOnce(mockPlayerPowerUps)
      .mockResolvedValueOnce([]) // After usage, no power-ups left
    vi.mocked(mockPowerUps.usePowerUp).mockResolvedValue({ 
      success: true, 
      message: 'Power-up used successfully' 
    })

    const { result } = renderHook(() => usePowerUps({ 
      playerId: 'player-1',
      questionId: 'question-1'
    }))

    await waitFor(() => {
      expect(result.current.powerUps).toEqual(mockPlayerPowerUps)
    })

    await act(async () => {
      await result.current.usePowerUpAction('skip_question')
    })

    await waitFor(() => {
      expect(result.current.powerUps).toEqual([])
    })

    expect(mockPowerUps.getPlayerPowerUps).toHaveBeenCalledTimes(2)
  })

  it('should handle power-up usage failure', async () => {
    const mockPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockPowerUps.getPlayerPowerUps).mockResolvedValue(mockPlayerPowerUps)
    vi.mocked(mockPowerUps.usePowerUp).mockResolvedValue({ 
      success: false, 
      message: 'No uses remaining' 
    })

    const { result } = renderHook(() => usePowerUps({ 
      playerId: 'player-1',
      questionId: 'question-1'
    }))

    await waitFor(() => {
      expect(result.current.powerUps).toEqual(mockPlayerPowerUps)
    })

    let usageResult: any
    await act(async () => {
      usageResult = await result.current.usePowerUpAction('skip_question')
    })

    expect(usageResult).toEqual({ success: false, message: 'No uses remaining' })
  })

  it('should return error when playerId or questionId is missing for power-up usage', async () => {
    const { result } = renderHook(() => usePowerUps())

    let usageResult: any
    await act(async () => {
      usageResult = await result.current.usePowerUpAction('skip_question')
    })

    expect(usageResult).toEqual({ 
      success: false, 
      message: 'Player ID and Question ID are required' 
    })
  })

  it('should handle power-up usage errors', async () => {
    const mockPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockPowerUps.getPlayerPowerUps).mockResolvedValue(mockPlayerPowerUps)
    vi.mocked(mockPowerUps.usePowerUp).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => usePowerUps({ 
      playerId: 'player-1',
      questionId: 'question-1'
    }))

    await waitFor(() => {
      expect(result.current.powerUps).toEqual(mockPlayerPowerUps)
    })

    let usageResult: unknown
    await act(async () => {
      usageResult = await result.current.usePowerUpAction('skip_question')
    })

    expect(usageResult).toEqual({ success: false, message: 'Network error' })
  })

  it('should manually refresh power-ups', async () => {
    const mockPowerUps = await import('@/lib/power-ups')
    vi.mocked(mockPowerUps.getPlayerPowerUps)
      .mockResolvedValueOnce(mockPlayerPowerUps)
      .mockResolvedValueOnce([])

    const { result } = renderHook(() => usePowerUps({ playerId: 'player-1' }))

    await waitFor(() => {
      expect(result.current.powerUps).toEqual(mockPlayerPowerUps)
    })

    await act(async () => {
      await result.current.refreshPowerUps()
    })

    await waitFor(() => {
      expect(result.current.powerUps).toEqual([])
    })

    expect(mockPowerUps.getPlayerPowerUps).toHaveBeenCalledTimes(2)
  })
})