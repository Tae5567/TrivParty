'use client'

import { useState, useEffect } from 'react'
import { Question } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, Users } from 'lucide-react'
import { FeedbackButton, AnswerOption } from '@/components/ui/FeedbackButton'
import { PowerUpPanel } from '@/components/ui/PowerUpPanel'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameSounds } from '@/hooks/useSoundEffects'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'
import { usePowerUps } from '@/hooks/usePowerUps'
import { wasPowerUpUsed } from '@/lib/power-ups'

interface AnswerSubmissionProps {
  question: Question
  onSubmitAnswer: (answer: string) => void
  timeRemaining?: number
  playersAnswered?: number
  totalPlayers?: number
  disabled?: boolean
  submitted?: boolean
  playerId?: string
  onSkipQuestion?: () => void
}

export function AnswerSubmission({
  question,
  onSubmitAnswer,
  timeRemaining,
  playersAnswered = 0,
  totalPlayers = 1,
  disabled = false,
  submitted = false,
  playerId,
  onSkipQuestion
}: AnswerSubmissionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(new Set())
  const [questionSkipped, setQuestionSkipped] = useState(false)
  
  const { playButtonClick, playCountdown } = useGameSounds()
  const { prefersReducedMotion } = useAnimationPreferences()
  
  const { powerUps, usePowerUpAction } = usePowerUps({
    playerId,
    questionId: question.id,
    autoInitialize: false
  })

  // Play countdown sound for last few seconds
  useEffect(() => {
    if (timeRemaining === 10 || timeRemaining === 5 || timeRemaining === 3 || timeRemaining === 2 || timeRemaining === 1) {
      playCountdown()
    }
  }, [timeRemaining, playCountdown])

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setJustSubmitted(false)
    setHiddenOptions(new Set())
    setQuestionSkipped(false)
  }, [question.id])

  // Handle power-up usage
  const handlePowerUpUse = async (powerUpType: 'skip_question' | 'double_points' | 'fifty_fifty') => {
    const result = await usePowerUpAction(powerUpType)
    
    if (result.success) {
      switch (powerUpType) {
        case 'skip_question':
          setQuestionSkipped(true)
          onSkipQuestion?.()
          break
        case 'fifty_fifty':
          // Hide two incorrect options
          const correctIndex = question.options.indexOf(question.correctAnswer)
          const incorrectIndices = question.options
            .map((_, index) => index)
            .filter(index => index !== correctIndex)
          
          // Randomly select 2 incorrect options to hide
          const shuffled = incorrectIndices.sort(() => Math.random() - 0.5)
          const toHide = shuffled.slice(0, 2)
          setHiddenOptions(new Set(toHide))
          break
        case 'double_points':
          // Double points is handled in the scoring system
          break
      }
    }
    
    return result
  }

  const handleAnswerSelect = (answer: string) => {
    if (disabled || submitted || questionSkipped) return
    setSelectedAnswer(answer)
  }

  const handleSubmit = () => {
    if (selectedAnswer && !disabled && !submitted && !questionSkipped) {
      setJustSubmitted(true)
      playButtonClick()
      onSubmitAnswer(selectedAnswer)
      
      // Reset animation state after a delay
      setTimeout(() => setJustSubmitted(false), 1000)
    }
  }

  const getOptionStyle = (option: string, index: number) => {
    const isSelected = selectedAnswer === option
    const isHidden = hiddenOptions.has(index)
    
    if (isHidden) {
      return 'bg-muted/50 text-muted-foreground/50 border-border opacity-30 cursor-not-allowed'
    }
    
    if (submitted || questionSkipped) {
      return isSelected
        ? 'bg-primary/20 text-primary border-primary'
        : 'bg-muted text-muted-foreground border-border opacity-60'
    }

    return isSelected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-background hover:bg-accent border-border hover:border-accent-foreground/20'
  }

  if (questionSkipped) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="text-6xl">⭐️</div>
              <h3 className="text-xl font-semibold">Question Skipped!</h3>
              <p className="text-muted-foreground">
                You used your Skip Question power-up. Waiting for the next question...
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Question Area */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          {/* Question Card */}
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <CardTitle className="text-lg sm:text-xl leading-relaxed">
                  {question.text}
                </CardTitle>
                {timeRemaining !== undefined && (
                  <motion.div 
                    className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground"
                    animate={!prefersReducedMotion && timeRemaining <= 10 ? { 
                      scale: [1, 1.1, 1],
                      color: '#ef4444'
                    } : {}}
                    transition={{ 
                      scale: { duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 },
                      color: { duration: 0.3 }
                    }}
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className={`text-xs sm:text-sm ${timeRemaining <= 10 ? 'text-red-500 font-medium' : ''}`}>
                      {timeRemaining}s
                    </span>
                  </motion.div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="grid gap-2 sm:gap-3">
                <AnimatePresence>
                  {question.options.map((option, index) => {
                    const isHidden = hiddenOptions.has(index)
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: isHidden ? 0.3 : 1, 
                          y: 0,
                          scale: isHidden ? 0.95 : 1
                        }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <AnswerOption
                          option={isHidden ? '❌ Option Eliminated' : option}
                          index={index}
                          isSelected={selectedAnswer === option}
                          disabled={disabled || submitted || isHidden}
                          onClick={() => !isHidden && handleAnswerSelect(option)}
                        />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Submission Controls */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    {playersAnswered} of {totalPlayers} players answered
                  </span>
                </div>
                
                <motion.div
                  animate={justSubmitted && !prefersReducedMotion ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer || disabled || submitted}
                    size="lg"
                    className="w-full sm:w-auto sm:min-w-32"
                  >
                    {submitted ? 'Submitted' : 'Submit Answer'}
                  </Button>
                </motion.div>
              </div>
              
              <AnimatePresence>
                {submitted && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '0.75rem' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="sm:mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="flex items-center gap-2 text-green-800 dark:text-green-200"
                    >
                      <motion.div
                        animate={!prefersReducedMotion ? { rotate: 360 } : {}}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </motion.div>
                      <span className="text-xs sm:text-sm font-medium">
                        Answer submitted! Waiting for other players...
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Power-Up Panel */}
        {playerId && (
          <div className="lg:col-span-1">
            <PowerUpPanel
              playerPowerUps={powerUps}
              onUsePowerUp={handlePowerUpUse}
              disabled={disabled || submitted}
            />
          </div>
        )}
      </div>
    </div>
  )
}