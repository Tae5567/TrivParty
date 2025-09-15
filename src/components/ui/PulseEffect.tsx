'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'

interface PulseEffectProps {
  isVisible: boolean
  color?: string
  size?: 'sm' | 'md' | 'lg'
  intensity?: 'low' | 'medium' | 'high'
  onComplete?: () => void
}

export function PulseEffect({
  isVisible,
  color = 'rgb(59, 130, 246)', // blue-500
  size = 'md',
  intensity = 'medium',
  onComplete
}: PulseEffectProps) {
  const { prefersReducedMotion } = useAnimationPreferences()

  if (!isVisible || prefersReducedMotion) return null

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const intensityConfig = {
    low: { scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0] },
    medium: { scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0] },
    high: { scale: [1, 2, 1], opacity: [0.5, 1, 0] }
  }

  return (
    <AnimatePresence>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 1, opacity: 0 }}
            animate={intensityConfig[intensity]}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              ease: "easeOut",
              onComplete: i === 2 ? onComplete : undefined
            }}
            className={`absolute rounded-full border-2 ${sizeClasses[size]}`}
            style={{
              borderColor: color,
              backgroundColor: `${color}20`
            }}
          />
        ))}
      </div>
    </AnimatePresence>
  )
}

// Ripple effect for button interactions
interface RippleEffectProps {
  isVisible: boolean
  x?: number
  y?: number
  color?: string
  onComplete?: () => void
}

export function RippleEffect({
  isVisible,
  x = 50,
  y = 50,
  color = 'rgba(255, 255, 255, 0.6)',
  onComplete
}: RippleEffectProps) {
  const { prefersReducedMotion } = useAnimationPreferences()

  if (!isVisible || prefersReducedMotion) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        animate={{ scale: 4, opacity: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        onAnimationComplete={onComplete}
        className="absolute rounded-full pointer-events-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: '20px',
          height: '20px',
          backgroundColor: color,
          transform: 'translate(-50%, -50%)'
        }}
      />
    </AnimatePresence>
  )
}

// Success burst effect
interface SuccessBurstProps {
  isVisible: boolean
  onComplete?: () => void
}

export function SuccessBurst({ isVisible, onComplete }: SuccessBurstProps) {
  const { prefersReducedMotion } = useAnimationPreferences()

  if (!isVisible || prefersReducedMotion) return null

  return (
    <AnimatePresence>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * (Math.PI / 180)
          const distance = 60
          
          return (
            <motion.div
              key={i}
              initial={{ 
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                onComplete: i === 7 ? onComplete : undefined
              }}
              className="absolute w-3 h-3 bg-green-400 rounded-full"
            />
          )
        })}
      </div>
    </AnimatePresence>
  )
}