import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WinnerCelebration, PodiumCelebration } from './WinnerCelebration'
import type { Player } from '@/types'

interface LeaderboardProps {
  players: Player[]
  title?: string
  showStats?: boolean
  isFinal?: boolean
  onPlayAgain?: () => void
  onNewQuiz?: () => void
  currentPlayerId?: string
  showCelebration?: boolean
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
  }, [value, duration, displayValue])

  return <span className={className}>{displayValue}</span>
}

export function Leaderboard({ 
  players, 
  title = "Leaderboard",
  showStats = false,
  isFinal = false,
  onPlayAgain,
  onNewQuiz,
  currentPlayerId,
  showCelebration = false
}: LeaderboardProps) {
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false)
  const [showPodiumCelebration, setShowPodiumCelebration] = useState(false)

  // Sort players by score (descending) and join time (ascending) for tie-breaking
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  useEffect(() => {
    if (isFinal && showCelebration && sortedPlayers.length > 0) {
      // Show winner celebration first
      setShowWinnerCelebration(true)
      
      // Then show podium celebration
      const timer = setTimeout(() => {
        setShowWinnerCelebration(false)
        if (sortedPlayers.length >= 2) {
          setShowPodiumCelebration(true)
        }
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isFinal, showCelebration, sortedPlayers.length])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2: return <Medal className="w-6 h-6 text-gray-400" />
      case 3: return <Award className="w-6 h-6 text-amber-600" />
      default: return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</div>
    }
  }

  const getRankBadgeColor = (rank: number): string => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-50'
      case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-50'
      case 3: return 'bg-gradient-to-r from-amber-500 to-amber-700 text-amber-50'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPlayerCardStyle = (rank: number, isCurrentPlayer: boolean): string => {
    let baseStyle = 'flex items-center gap-4 p-4 rounded-lg transition-all duration-200 '
    
    if (isCurrentPlayer) {
      baseStyle += 'bg-primary/10 border-2 border-primary/30 shadow-md '
    } else {
      baseStyle += 'bg-card border border-border '
    }

    if (rank === 1) {
      baseStyle += 'ring-2 ring-yellow-400/50 '
    }

    return baseStyle
  }

  const totalPlayers = players.length
  const averageScore = totalPlayers > 0 
    ? Math.round(players.reduce((sum, p) => sum + p.score, 0) / totalPlayers) 
    : 0
  const highestScore = sortedPlayers[0]?.score || 0

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4 sm:pb-6">
        <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-2xl">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          {title}
        </CardTitle>
        {isFinal && (
          <p className="text-muted-foreground text-sm sm:text-base">
            🎉 Congratulations to all players! 🎉
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        {showStats && totalPlayers > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Players</span>
              </div>
              <AnimatedNumber 
                value={totalPlayers} 
                className="text-base sm:text-lg font-bold block"
              />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Highest</p>
              <AnimatedNumber 
                value={highestScore} 
                className="text-base sm:text-lg font-bold block"
              />
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">Average</p>
              <AnimatedNumber 
                value={averageScore} 
                className="text-base sm:text-lg font-bold block"
              />
            </div>
          </div>
        )}

        {/* Player Rankings */}
        <div className="space-y-2 sm:space-y-3">
          <AnimatePresence>
            {sortedPlayers.map((player, index) => {
              const rank = index + 1
              const isCurrentPlayer = player.id === currentPlayerId
              
              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    layout: { duration: 0.3, ease: "easeInOut" },
                    opacity: { duration: 0.2 },
                    y: { duration: 0.2 }
                  }}
                  className={getPlayerCardStyle(rank, isCurrentPlayer)}
                >
                  {/* Rank Icon */}
                  <motion.div 
                    className="flex-shrink-0"
                    animate={rank === 1 && isFinal ? { 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {getRankIcon(rank)}
                  </motion.div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <p className={`font-semibold truncate text-sm sm:text-base ${isCurrentPlayer ? 'text-primary' : ''}`}>
                        {player.nickname}
                      </p>
                      {isCurrentPlayer && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                      {rank <= 3 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                        >
                          <Badge className={`text-xs ${getRankBadgeColor(rank)}`}>
                            <span className="hidden sm:inline">
                              {rank === 1 ? '1st Place' : rank === 2 ? '2nd Place' : '3rd Place'}
                            </span>
                            <span className="sm:hidden">
                              {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                            </span>
                          </Badge>
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <span className="hidden sm:inline">Joined </span>
                      {new Date(player.joinedAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <AnimatedNumber 
                      value={player.score} 
                      className="text-xl sm:text-2xl font-bold font-mono block"
                      duration={0.8}
                    />
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {players.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-muted-foreground">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <p className="text-base sm:text-lg">No players yet</p>
            <p className="text-sm">Waiting for players to join...</p>
          </div>
        )}

        {/* Final Game Actions */}
        {isFinal && (onPlayAgain || onNewQuiz) && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
            {onPlayAgain && (
              <Button 
                onClick={onPlayAgain} 
                variant="outline" 
                className="flex-1"
              >
                Play Again
              </Button>
            )}
            {onNewQuiz && (
              <Button 
                onClick={onNewQuiz} 
                className="flex-1"
              >
                New Quiz
              </Button>
            )}
          </div>
        )}

        {/* Winner Celebration */}
        {sortedPlayers.length > 0 && (
          <>
            <WinnerCelebration
              winnerName={sortedPlayers[0].nickname}
              winnerScore={sortedPlayers[0].score}
              isVisible={showWinnerCelebration}
              onComplete={() => setShowWinnerCelebration(false)}
              showConfetti={true}
            />
            
            <PodiumCelebration
              topPlayers={sortedPlayers.slice(0, 3).map((player, index) => ({
                name: player.nickname,
                score: player.score,
                rank: index + 1
              }))}
              isVisible={showPodiumCelebration}
              onComplete={() => setShowPodiumCelebration(false)}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Compact leaderboard for in-game display
interface CompactLeaderboardProps {
  players: Player[]
  maxVisible?: number
  currentPlayerId?: string
}

export function CompactLeaderboard({ 
  players, 
  maxVisible = 5, 
  currentPlayerId 
}: CompactLeaderboardProps) {
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score
    }
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  })

  const visiblePlayers = sortedPlayers.slice(0, maxVisible)
  const remainingCount = Math.max(0, sortedPlayers.length - maxVisible)

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        Top Players
      </h4>
      
      <div className="space-y-1">
        {visiblePlayers.map((player, index) => {
          const rank = index + 1
          const isCurrentPlayer = player.id === currentPlayerId
          
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between text-sm py-1 px-2 rounded ${
                isCurrentPlayer ? 'bg-primary/10 text-primary font-medium' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-4">#{rank}</span>
                <span className="truncate">{player.nickname}</span>
              </div>
              <AnimatedNumber 
                value={player.score} 
                className="font-mono font-semibold"
              />
            </div>
          )
        })}
        
        {remainingCount > 0 && (
          <div className="text-xs text-muted-foreground text-center py-1">
            +{remainingCount} more player{remainingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}