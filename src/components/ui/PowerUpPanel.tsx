'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SkipForward, Zap, Target, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'
import { useGameSounds } from '@/hooks/useSoundEffects'
import type { PlayerPowerUp, PowerUpType } from '@/types'

interface PowerUpPanelProps {
  playerPowerUps: PlayerPowerUp[]
  onUsePowerUp: (powerUpType: PowerUpType) => Promise<{ success: boolean; message: string }>
  disabled?: boolean
  className?: string
}

const POWER_UP_ICONS = {
  skip_question: SkipForward,
  double_points: Zap,
  fifty_fifty: Target
} as const

const POWER_UP_COLORS = {
  skip_question: 'bg-blue-500 hover:bg-blue-600',
  double_points: 'bg-yellow-500 hover:bg-yellow-600',
  fifty_fifty: 'bg-purple-500 hover:bg-purple-600'
} as const

export function PowerUpPanel({ 
  playerPowerUps, 
  onUsePowerUp, 
  disabled = false,
  className = '' 
}: PowerUpPanelProps) {
  const [usingPowerUp, setUsingPowerUp] = useState<PowerUpType | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  const { prefersReducedMotion } = useAnimationPreferences()
  const { playButtonClick, playPowerUpActivate } = useGameSounds()

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const handleUsePowerUp = async (powerUpType: PowerUpType) => {
    if (disabled || usingPowerUp) return

    setUsingPowerUp(powerUpType)
    playButtonClick()

    try {
      const result = await onUsePowerUp(powerUpType)
      
      if (result.success) {
        playPowerUpActivate()
        setFeedback({ type: 'success', message: result.message })
      } else {
        setFeedback({ type: 'error', message: result.message })
      }
    } catch (error) {
      setFeedback({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to use power-up' 
      })
    } finally {
      setUsingPowerUp(null)
    }
  }

  const getPowerUpByType = (type: PowerUpType) => {
    return playerPowerUps.find(p => p.powerUp?.name === type)
  }

  const renderPowerUpButton = (powerUpType: PowerUpType) => {
    const powerUp = getPowerUpByType(powerUpType)
    const Icon = POWER_UP_ICONS[powerUpType]
    const colorClass = POWER_UP_COLORS[powerUpType]
    
    if (!powerUp || !powerUp.powerUp) return null

    const isUsing = usingPowerUp === powerUpType
    const canUse = powerUp.usesRemaining > 0 && !disabled && !isUsing
    
    return (
      <motion.div
        key={powerUpType}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        whileHover={!prefersReducedMotion && canUse ? { scale: 1.05 } : {}}
        whileTap={!prefersReducedMotion && canUse ? { scale: 0.95 } : {}}
      >
        <Button
          onClick={() => handleUsePowerUp(powerUpType)}
          disabled={!canUse}
          className={`relative h-16 w-full flex flex-col items-center justify-center gap-1 text-white ${colorClass} ${
            !canUse ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <motion.div
            animate={isUsing && !prefersReducedMotion ? { 
              rotate: 360,
              scale: [1, 1.2, 1]
            } : {}}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          
          <span className="text-xs font-medium">
            {powerUp.powerUp.name.replace('_', ' ').toUpperCase()}
          </span>
          
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-white text-gray-800"
          >
            {powerUp.usesRemaining}
          </Badge>
          
          {isUsing && (
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </Button>
      </motion.div>
    )
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Power-Ups
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          {renderPowerUpButton('skip_question')}
          {renderPowerUpButton('double_points')}
          {renderPowerUpButton('fifty_fifty')}
        </div>

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-2 rounded-md text-sm text-center ${
                feedback.type === 'success' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
              }`}
            >
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-xs text-muted-foreground text-center">
          Use power-ups strategically to gain an advantage!
        </div>
      </CardContent>
    </Card>
  )
}