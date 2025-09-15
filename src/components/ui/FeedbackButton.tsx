'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button, ButtonProps } from '@/components/ui/button'
import { useGameSounds } from '@/hooks/useSoundEffects'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'
import { RippleEffect, SuccessBurst } from './PulseEffect'

interface FeedbackButtonProps extends ButtonProps {
  children: React.ReactNode
  enableSounds?: boolean
  enableHaptics?: boolean
  feedbackType?: 'default' | 'success' | 'error' | 'warning'
  pulseOnHover?: boolean
}

export function FeedbackButton({
  children,
  enableSounds = true,
  enableHaptics = true,
  feedbackType = 'default',
  pulseOnHover = false,
  onClick,
  onMouseEnter,
  className = '',
  disabled,
  ...props
}: FeedbackButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const { playButtonClick, playButtonHover, isEnabled: soundsEnabled } = useGameSounds()
  const { prefersReducedMotion } = useAnimationPreferences()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // Visual feedback
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    // Audio feedback
    if (enableSounds && soundsEnabled) {
      playButtonClick()
    }

    // Haptic feedback (if supported)
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }

    onClick?.(e)
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    // Audio feedback for hover
    if (enableSounds && soundsEnabled) {
      playButtonHover()
    }

    onMouseEnter?.(e)
  }

  const getFeedbackColors = () => {
    switch (feedbackType) {
      case 'success':
        return 'hover:shadow-green-200 dark:hover:shadow-green-800/50'
      case 'error':
        return 'hover:shadow-red-200 dark:hover:shadow-red-800/50'
      case 'warning':
        return 'hover:shadow-yellow-200 dark:hover:shadow-yellow-800/50'
      default:
        return 'hover:shadow-primary/20'
    }
  }

  const motionProps = prefersReducedMotion ? {} : {
    whileHover: pulseOnHover ? { scale: 1.05 } : { scale: 1.02 },
    whileTap: { scale: 0.98 },
    animate: isPressed ? { scale: 0.95 } : { scale: 1 },
    transition: { duration: 0.1, ease: "easeInOut" }
  }

  return (
    <motion.div {...motionProps}>
      <Button
        {...props}
        disabled={disabled}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={`
          transition-all duration-200 
          hover:shadow-lg ${getFeedbackColors()}
          focus:ring-2 focus:ring-offset-2 focus:ring-ring
          active:shadow-inner
          ${className}
        `}
      >
        {children}
      </Button>
    </motion.div>
  )
}

// Enhanced answer option button with visual feedback
interface AnswerOptionProps {
  option: string
  index: number
  isSelected: boolean
  isCorrect?: boolean
  isIncorrect?: boolean
  showResults?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function AnswerOption({
  option,
  index,
  isSelected,
  isCorrect,
  isIncorrect,
  showResults = false,
  disabled = false,
  onClick
}: AnswerOptionProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showRipple, setShowRipple] = useState(false)
  const [showSuccessBurst, setShowSuccessBurst] = useState(false)
  const [ripplePosition, setRipplePosition] = useState({ x: 50, y: 50 })
  
  const { playButtonHover, playCorrectAnswer, isEnabled: soundsEnabled } = useGameSounds()
  const { prefersReducedMotion } = useAnimationPreferences()

  // Show success burst when answer is revealed as correct
  React.useEffect(() => {
    if (showResults && isCorrect && isSelected) {
      setShowSuccessBurst(true)
      playCorrectAnswer()
    }
  }, [showResults, isCorrect, isSelected, playCorrectAnswer])

  const getOptionStyle = () => {
    if (showResults) {
      if (isCorrect) {
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 shadow-green-200/50'
      }
      if (isIncorrect) {
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 shadow-red-200/50'
      }
      return 'bg-muted text-muted-foreground border-border opacity-60'
    }

    if (isSelected) {
      return 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
    }

    return 'bg-background hover:bg-accent border-border hover:border-accent-foreground/20 hover:shadow-md'
  }

  const handleMouseEnter = () => {
    if (disabled || showResults) return
    
    setIsHovered(true)
    if (soundsEnabled) {
      playButtonHover()
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || showResults) return
    
    // Calculate ripple position based on click location
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setRipplePosition({ x, y })
    setShowRipple(true)
    
    onClick?.()
  }

  const motionProps = prefersReducedMotion ? {} : {
    whileHover: !disabled && !showResults ? { 
      scale: 1.02,
      y: -2
    } : {},
    whileTap: !disabled && !showResults ? { scale: 0.98 } : {},
    animate: {
      scale: isSelected ? 1.02 : 1,
      boxShadow: isHovered && !disabled && !showResults 
        ? '0 8px 25px rgba(0, 0, 0, 0.1)' 
        : '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    transition: { duration: 0.2, ease: "easeInOut" }
  }

  return (
    <motion.button
      {...motionProps}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      className={`
        p-3 sm:p-4 text-left rounded-lg border-2 transition-all duration-200
        ${getOptionStyle()}
        ${!disabled && !showResults ? 'cursor-pointer' : 'cursor-default'}
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        touch-manipulation relative overflow-hidden
      `}
    >
      {/* Ripple effect overlay */}
      {isSelected && !prefersReducedMotion && (
        <motion.div
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 bg-white/20 rounded-lg"
        />
      )}
      
      <div className="flex items-center gap-2 sm:gap-3 relative z-10">
        <motion.div 
          className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-current/10 flex items-center justify-center text-xs sm:text-sm font-medium"
          animate={isSelected && !prefersReducedMotion ? {
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.3 }}
        >
          {String.fromCharCode(65 + index)}
        </motion.div>
        <span className="flex-1 text-sm sm:text-base">{option}</span>
        
        {/* Selection indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            className="flex-shrink-0"
          >
            <div className="w-5 h-5 rounded-full bg-current flex items-center justify-center">
              <svg className="w-3 h-3 text-current" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>

      {/* Visual effects */}
      <RippleEffect
        isVisible={showRipple}
        x={ripplePosition.x}
        y={ripplePosition.y}
        color={isSelected ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
        onComplete={() => setShowRipple(false)}
      />
      
      <SuccessBurst
        isVisible={showSuccessBurst}
        onComplete={() => setShowSuccessBurst(false)}
      />
    </motion.button>
  )
}