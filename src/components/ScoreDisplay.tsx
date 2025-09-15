import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import type { Player } from '@/types'

interface ScoreDisplayProps {
  players: Player[]
  currentPlayerId?: string
  showRanking?: boolean
  compact?: boolean
  className?: string
}

export function ScoreDisplay({ 
  players, 
  currentPlayerId, 
  showRanking = true, 
  compact = false,
  className = ""
}: ScoreDisplayProps) {
  // Sort players by score (descending) and join time (ascending) for tie-breaking
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  const getRankSuffix = (rank: number): string => {
    if (rank === 1) return 'st'
    if (rank === 2) return 'nd'
    if (rank === 3) return 'rd'
    return 'th'
  }

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-yellow-50'
      case 2: return 'bg-gray-400 text-gray-50'
      case 3: return 'bg-amber-600 text-amber-50'
      default: return 'bg-blue-500 text-blue-50'
    }
  }

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {sortedPlayers.map((player, index) => {
          const rank = index + 1
          const isCurrentPlayer = player.id === currentPlayerId
          
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isCurrentPlayer 
                  ? 'bg-primary text-primary-foreground font-semibold' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {showRanking && (
                <Badge variant="secondary" className={`text-xs ${getRankColor(rank)}`}>
                  {rank}
                </Badge>
              )}
              <span className="truncate max-w-16 sm:max-w-20">{player.nickname}</span>
              <AnimatedNumber 
                value={player.score} 
                className="font-mono font-semibold"
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base sm:text-lg mb-3">Current Scores</h3>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1
            const isCurrentPlayer = player.id === currentPlayerId
            
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isCurrentPlayer 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {showRanking && (
                    <Badge className={`${getRankColor(rank)} min-w-8 justify-center`}>
                      {rank}{getRankSuffix(rank)}
                    </Badge>
                  )}
                  <div>
                    <p className={`font-medium ${isCurrentPlayer ? 'text-primary' : ''}`}>
                      {player.nickname}
                      {isCurrentPlayer && (
                        <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <AnimatedNumber 
                    value={player.score} 
                    className="font-mono text-lg font-bold block"
                  />
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            )
          })}
        </div>
        
        {players.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No players yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Animated number counter component
interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

function AnimatedNumber({ value, duration = 0.5, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const startValue = displayValue
    const difference = value - startValue
    const startTime = Date.now()

    if (difference === 0) return

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.round(startValue + difference * easeOutQuart)
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span className={className}>{displayValue}</span>
}

// Animated score update component for showing point changes
interface ScoreUpdateProps {
  pointsEarned: number
  isVisible: boolean
  onAnimationComplete?: () => void
}

export function ScoreUpdate({ pointsEarned, isVisible, onAnimationComplete }: ScoreUpdateProps) {
  useEffect(() => {
    if (isVisible && onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, 2000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onAnimationComplete])

  if (!isVisible || pointsEarned === 0) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.5, y: 0 }}
        animate={{ opacity: 1, scale: 1, y: -50 }}
        exit={{ opacity: 0, scale: 0.5, y: -100 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: pointsEarned > 0 ? [0, 5, -5, 0] : [0, -5, 5, 0]
          }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`
            text-4xl font-bold px-6 py-3 rounded-lg shadow-lg
            ${pointsEarned > 0 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
            }
          `}
        >
          {pointsEarned > 0 ? '+' : ''}{pointsEarned}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}