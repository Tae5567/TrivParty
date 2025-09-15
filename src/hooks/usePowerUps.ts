'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPlayerPowerUps, usePowerUp, initializePlayerPowerUps } from '@/lib/power-ups'
import type { PlayerPowerUp, PowerUpType } from '@/types'

interface UsePowerUpsOptions {
  playerId?: string
  questionId?: string
  autoInitialize?: boolean
}

interface UsePowerUpsReturn {
  powerUps: PlayerPowerUp[]
  loading: boolean
  error: string | null
  usePowerUpAction: (powerUpType: PowerUpType) => Promise<{ success: boolean; message: string }>
  refreshPowerUps: () => Promise<void>
  initializePowerUps: () => Promise<void>
}

export function usePowerUps({ 
  playerId, 
  questionId, 
  autoInitialize = false 
}: UsePowerUpsOptions = {}): UsePowerUpsReturn {
  const [powerUps, setPowerUps] = useState<PlayerPowerUp[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshPowerUps = useCallback(async () => {
    if (!playerId) return

    setLoading(true)
    setError(null)

    try {
      const playerPowerUps = await getPlayerPowerUps(playerId)
      setPowerUps(playerPowerUps)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load power-ups'
      setError(errorMessage)
      console.error('Error loading power-ups:', err)
    } finally {
      setLoading(false)
    }
  }, [playerId])

  const initializePowerUps = useCallback(async () => {
    if (!playerId) return

    setLoading(true)
    setError(null)

    try {
      await initializePlayerPowerUps(playerId)
      await refreshPowerUps()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize power-ups'
      setError(errorMessage)
      console.error('Error initializing power-ups:', err)
    } finally {
      setLoading(false)
    }
  }, [playerId, refreshPowerUps])

  const usePowerUpAction = useCallback(async (powerUpType: PowerUpType) => {
    if (!playerId || !questionId) {
      return { success: false, message: 'Player ID and Question ID are required' }
    }

    try {
      const result = await usePowerUp(playerId, powerUpType, questionId)
      
      if (result.success) {
        // Refresh power-ups to update the UI
        await refreshPowerUps()
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to use power-up'
      return { success: false, message: errorMessage }
    }
  }, [playerId, questionId, refreshPowerUps])

  // Load power-ups when playerId changes
  useEffect(() => {
    if (playerId) {
      if (autoInitialize) {
        initializePowerUps()
      } else {
        refreshPowerUps()
      }
    }
  }, [playerId, autoInitialize, initializePowerUps, refreshPowerUps])

  return {
    powerUps,
    loading,
    error,
    usePowerUpAction,
    refreshPowerUps,
    initializePowerUps
  }
}