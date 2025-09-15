'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'

interface ConfettiProps {
  isVisible: boolean
  onComplete?: () => void
  duration?: number
  particleCount?: number
  colors?: string[]
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
}

export function Confetti({ 
  isVisible, 
  onComplete, 
  duration = 3000,
  particleCount = 50,
  colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
}: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const { prefersReducedMotion } = useAnimationPreferences()

  useEffect(() => {
    if (!isVisible || prefersReducedMotion) {
      setParticles([])
      return
    }

    // Generate particles
    const newParticles: Particle[] = []
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -10,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * 5 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      })
    }
    setParticles(newParticles)

    // Clean up after duration
    const timer = setTimeout(() => {
      setParticles([])
      onComplete?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [isVisible, particleCount, colors, duration, onComplete, prefersReducedMotion])

  if (!isVisible || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              rotate: particle.rotation,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: particle.x + particle.vx * 100,
              y: window.innerHeight + 100,
              rotate: particle.rotation + particle.rotationSpeed * 100,
              scale: 0.5,
              opacity: 0
            }}
            transition={{
              duration: duration / 1000,
              ease: "easeOut"
            }}
            className="absolute"
            style={{
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
              borderRadius: '2px'
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Simpler CSS-based confetti for better performance
export function SimpleConfetti({ 
  isVisible, 
  onComplete, 
  duration = 2000 
}: Pick<ConfettiProps, 'isVisible' | 'onComplete' | 'duration'>) {
  const { prefersReducedMotion } = useAnimationPreferences()

  useEffect(() => {
    if (isVisible && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onComplete, prefersReducedMotion])

  if (!isVisible || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="confetti-container">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: [
                '#FFD700', '#FF6B6B', '#4ECDC4', 
                '#45B7D1', '#96CEB4', '#FFEAA7'
              ][Math.floor(Math.random() * 6)]
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        .confetti-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          animation: confetti-fall ${duration}ms ease-out forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}