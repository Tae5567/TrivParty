import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  getAllPowerUps, 
  getPlayerPowerUps, 
  initializePlayerPowerUps, 
  usePowerUp, 
  wasPowerUpUsed,
  resetSessionPowerUps
} from '../power-ups'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn()
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            then: vi.fn()
          }))
        })),
        insert: vi.fn(() => ({
          then: vi.fn()
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            then: vi.fn()
          }))
        })),
        delete: vi.fn(() => ({
          in: vi.fn(() => ({
            then: vi.fn()
          }))
        }))
      }))
    }))
  }
}))

describe('Power-ups System', () => {
  const mockPowerUps = [
    {
      id: 'power-up-1',
      name: 'skip_question',
      description: 'Skip a difficult question without penalty',
      icon: 'SkipForward',
      max_uses_per_game: 1,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'power-up-2',
      name: 'double_points',
      description: 'Double points for the next correct answer',
      icon: 'Zap',
      max_uses_per_game: 1,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'power-up-3',
      name: 'fifty_fifty',
      description: 'Remove two incorrect answer options',
      icon: 'Target',
      max_uses_per_game: 1,
      created_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockPlayerPowerUps = [
    {
      id: 'player-power-up-1',
      player_id: 'player-1',
      power_up_id: 'power-up-1',
      uses_remaining: 1,
      created_at: '2024-01-01T00:00:00Z',
      power_ups: mockPowerUps[0]
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllPowerUps', () => {
    it('should return all available power-ups', async () => {
      const mockSupabase = await import('../supabase')
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockPowerUps, error: null }))
        }))
      }))
      mockSupabase.supabase.from = mockFrom

      const result = await getAllPowerUps()

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        id: 'power-up-1',
        name: 'skip_question',
        description: 'Skip a difficult question without penalty',
        icon: 'SkipForward',
        maxUsesPerGame: 1,
        createdAt: '2024-01-01T00:00:00Z'
      })
    })

    it('should throw error when database query fails', async () => {
      const mockSupabase = await import('../supabase')
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
        }))
      }))
      mockSupabase.supabase.from = mockFrom

      await expect(getAllPowerUps()).rejects.toThrow('Failed to get power-ups: Database error')
    })
  })

  describe('getPlayerPowerUps', () => {
    it('should return power-ups for a specific player', async () => {
      const mockSupabase = await import('../supabase')
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: mockPlayerPowerUps, error: null }))
        }))
      }))
      mockSupabase.supabase.from = mockFrom

      const result = await getPlayerPowerUps('player-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
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
      })
    })
  })

  describe('usePowerUp', () => {
    it('should successfully use a power-up', async () => {
      const mockSupabase = await import('../supabase')
      
      // Mock the power-up lookup
      const mockPowerUpQuery = vi.fn(() => Promise.resolve({ 
        data: { id: 'power-up-1' }, 
        error: null 
      }))
      
      // Mock the player power-up check
      const mockPlayerPowerUpQuery = vi.fn(() => Promise.resolve({ 
        data: { uses_remaining: 1 }, 
        error: null 
      }))
      
      // Mock existing usage check
      const mockExistingUsageQuery = vi.fn(() => Promise.resolve({ 
        data: null, 
        error: null 
      }))
      
      // Mock usage insert
      const mockUsageInsert = vi.fn(() => Promise.resolve({ error: null }))
      
      // Mock uses update
      const mockUsesUpdate = vi.fn(() => Promise.resolve({ error: null }))

      let callCount = 0
      const mockFrom = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          // First call: get power-up by name
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: mockPowerUpQuery
              }))
            }))
          }
        } else if (callCount === 2) {
          // Second call: get player power-up
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: mockPlayerPowerUpQuery
                }))
              }))
            }))
          }
        } else if (callCount === 3) {
          // Third call: check existing usage
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: mockExistingUsageQuery
                  }))
                }))
              }))
            }))
          }
        } else if (callCount === 4) {
          // Fourth call: insert usage
          return {
            insert: mockUsageInsert
          }
        } else {
          // Fifth call: update uses
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: mockUsesUpdate
              }))
            }))
          }
        }
      })
      
      mockSupabase.supabase.from = mockFrom

      const result = await usePowerUp('player-1', 'skip_question', 'question-1')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Power-up used successfully')
    })

    it('should fail when power-up not found', async () => {
      const mockSupabase = await import('../supabase')
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }))
          }))
        }))
      }))
      mockSupabase.supabase.from = mockFrom

      const result = await usePowerUp('player-1', 'skip_question', 'question-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Power-up not found')
    })

    it('should fail when no uses remaining', async () => {
      const mockSupabase = await import('../supabase')
      
      let callCount = 0
      const mockFrom = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: 'power-up-1' }, error: null }))
              }))
            }))
          }
        } else {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: { uses_remaining: 0 }, error: null }))
                }))
              }))
            }))
          }
        }
      })
      
      mockSupabase.supabase.from = mockFrom

      const result = await usePowerUp('player-1', 'skip_question', 'question-1')

      expect(result.success).toBe(false)
      expect(result.message).toBe('No uses remaining for this power-up')
    })
  })

  describe('wasPowerUpUsed', () => {
    it('should return true when power-up was used', async () => {
      const mockSupabase = await import('../supabase')
      
      let callCount = 0
      const mockFrom = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: 'power-up-1' }, error: null }))
              }))
            }))
          }
        } else {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { id: 'usage-1' }, error: null }))
                  }))
                }))
              }))
            }))
          }
        }
      })
      
      mockSupabase.supabase.from = mockFrom

      const result = await wasPowerUpUsed('player-1', 'skip_question', 'question-1')

      expect(result).toBe(true)
    })

    it('should return false when power-up was not used', async () => {
      const mockSupabase = await import('../supabase')
      
      let callCount = 0
      const mockFrom = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: { id: 'power-up-1' }, error: null }))
              }))
            }))
          }
        } else {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null }))
                  }))
                }))
              }))
            }))
          }
        }
      })
      
      mockSupabase.supabase.from = mockFrom

      const result = await wasPowerUpUsed('player-1', 'skip_question', 'question-1')

      expect(result).toBe(false)
    })
  })
})