'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Star, Sparkles } from 'lucide-react'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'
import { useGameSounds } from '@/hooks/useSoundEffects'
import { SimpleConfetti } from './Confetti'

interface WinnerCelebrationProps {
  winnerName: string
  winnerScore: number
  isVisible: boolean
  onComplete?: () => void
  showConfetti?: boolean
}

export function WinnerCelebration({
  winnerName,
  winnerScore,
  isVisible,
  onComplete,
  showConfetti = true
}: WinnerCelebrationProps) {
  const [showElements, setShowElements] = useState(false)
  const [showConfettiState, setShowConfettiState] = useState(false)
  const { prefersReducedMotion } = useAnimationPreferences()
  const { playCelebration, playWinner, playVictoryFanfare } = useGameSounds()

  useEffect(() => {
    if (isVisible) {
      // Play winner sound
      playWinner()
      
      // Show elements with delay
      const timer1 = setTimeout(() => setShowElements(true), 300)
      
      // Show confetti
      if (showConfetti) {
        const timer2 = setTimeout(() => setShowConfettiState(true), 500)
        const timer3 = setTimeout(() => setShowConfettiState(false), 3500)
        
        return () => {
          clearTimeout(timer1)
          clearTimeout(timer2)
          clearTimeout(timer3)
        }
      }
      
      // Play victory fanfare sequence
      setTimeout(() => playVictoryFanfare(), 800)
      
      // Auto complete after animation
      const completeTimer = setTimeout(() => {
        setShowElements(false)
        onComplete?.()
      }, 4000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(completeTimer)
      }
    } else {
      setShowElements(false)
      setShowConfettiState(false)
    }
  }, [isVisible, showConfetti, onComplete, playWinner, playVictoryFanfare])

  if (!isVisible) return null

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <SimpleConfetti 
          isVisible={showConfettiState} 
          duration={3000}
        />
      )}

      {/* Winner Celebration Overlay */}
      <AnimatePresence>
        {showElements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ 
                duration: 0.8, 
                ease: "backOut",
                type: "spring",
                stiffness: 100
              }}
              className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl p-8 text-center shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              {/* Background sparkles */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: Math.random() * 100 + '%',
                      y: Math.random() * 100 + '%'
                    }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 0],
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 2,
                      delay: Math.random() * 2,
                      repeat: Infinity,
                      repeatDelay: Math.random() * 3
                    }}
                    className="absolute"
                  >
                    <Star className="w-4 h-4 text-white/60" />
                  </motion.div>
                ))}
              </div>

              {/* Crown animation */}
              <motion.div
                animate={!prefersReducedMotion ? {
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <Crown className="w-16 h-16 mx-auto text-yellow-100 mb-4" />
              </motion.div>

              {/* Winner text */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="relative z-10"
              >
                <h2 className="text-3xl font-bold text-yellow-50 mb-2">
                  🎉 Winner! 🎉
                </h2>
                <p className="text-xl text-yellow-100 mb-2 font-semibold">
                  {winnerName}
                </p>
                <motion.p 
                  className="text-2xl font-bold text-yellow-50"
                  animate={!prefersReducedMotion ? {
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {winnerScore} points
                </motion.p>
              </motion.div>

              {/* Trophy animation */}
              <motion.div
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ 
                  delay: 0.5, 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200
                }}
                className="mt-6 relative z-10"
              >
                <motion.div
                  animate={!prefersReducedMotion ? {
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Trophy className="w-12 h-12 mx-auto text-yellow-100" />
                </motion.div>
              </motion.div>

              {/* Sparkles around the card */}
              <div className="absolute -inset-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 0],
                      rotate: 360
                    }}
                    transition={{ 
                      duration: 1.5,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute"
                    style={{
                      left: `${20 + (i % 4) * 20}%`,
                      top: `${20 + Math.floor(i / 4) * 60}%`
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Podium celebration for top 3 players
interface PodiumCelebrationProps {
  topPlayers: Array<{ name: string; score: number; rank: number }>
  isVisible: boolean
  onComplete?: () => void
}

export function PodiumCelebration({
  topPlayers,
  isVisible,
  onComplete
}: PodiumCelebrationProps) {
  const { prefersReducedMotion } = useAnimationPreferences()
  const { playCelebration } = useGameSounds()

  useEffect(() => {
    if (isVisible) {
      playCelebration()
      const timer = setTimeout(() => onComplete?.(), 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete, playCelebration])

  if (!isVisible) return null

  const podiumHeights = ['h-32', 'h-24', 'h-20']
  const podiumColors = [
    'bg-gradient-to-t from-yellow-400 to-yellow-500',
    'bg-gradient-to-t from-gray-300 to-gray-400', 
    'bg-gradient-to-t from-amber-500 to-amber-600'
  ]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.5, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.5, y: 100 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl max-w-2xl w-full"
        >
          <motion.h2 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-center mb-8"
          >
            🏆 Final Results 🏆
          </motion.h2>

          <div className="flex items-end justify-center gap-4 mb-8">
            {topPlayers.slice(0, 3).map((player, index) => {
              const actualRank = player.rank - 1
              const displayOrder = actualRank === 0 ? 1 : actualRank === 1 ? 0 : 2
              
              return (
                <motion.div
                  key={player.name}
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: 0.5 + displayOrder * 0.2,
                    duration: 0.6,
                    ease: "backOut"
                  }}
                  className="text-center"
                >
                  <motion.div
                    animate={!prefersReducedMotion && actualRank === 0 ? {
                      y: [0, -5, 0],
                      scale: [1, 1.05, 1]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="mb-2"
                  >
                    {actualRank === 0 && <Crown className="w-8 h-8 mx-auto text-yellow-500 mb-1" />}
                    {actualRank === 1 && <Trophy className="w-6 h-6 mx-auto text-gray-400 mb-1" />}
                    {actualRank === 2 && <Trophy className="w-6 h-6 mx-auto text-amber-600 mb-1" />}
                    
                    <p className="font-bold text-sm mb-1">{player.name}</p>
                    <p className="text-lg font-bold">{player.score}</p>
                  </motion.div>
                  
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    transition={{ 
                      delay: 0.8 + displayOrder * 0.1,
                      duration: 0.5
                    }}
                    className={`
                      ${podiumHeights[actualRank]} w-20 ${podiumColors[actualRank]} 
                      rounded-t-lg flex items-end justify-center pb-2
                    `}
                  >
                    <span className="text-white font-bold text-2xl">
                      {actualRank + 1}
                    </span>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center"
          >
            <p className="text-muted-foreground">
              Congratulations to all players! 🎉
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}