'use client'

import { Question } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnimationPreferences } from '@/hooks/useAnimationPreferences'
import { useGameSounds } from '@/hooks/useSoundEffects'
import { AnswerOption } from '@/components/ui/FeedbackButton'
import { SimpleConfetti } from '@/components/ui/Confetti'
import { useState, useEffect } from 'react'

interface QuestionDisplayProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  timeRemaining?: number
  showResults?: boolean
  correctAnswer?: string
  selectedAnswer?: string
  onAnswerSelect?: (answer: string) => void
  disabled?: boolean
  showCelebration?: boolean
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  showResults = false,
  correctAnswer,
  selectedAnswer,
  onAnswerSelect,
  disabled = false,
  showCelebration = false
}: QuestionDisplayProps) {
  const { getAnimationConfig } = useAnimationPreferences()
  const { playCorrectAnswer, playIncorrectAnswer, playCountdown } = useGameSounds()
  const [showConfetti, setShowConfetti] = useState(false)

  // Play sound effects based on results
  useEffect(() => {
    if (showResults && selectedAnswer && correctAnswer) {
      if (selectedAnswer === correctAnswer) {
        playCorrectAnswer()
        if (showCelebration) {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 2000)
        }
      } else {
        playIncorrectAnswer()
      }
    }
  }, [showResults, selectedAnswer, correctAnswer, playCorrectAnswer, playIncorrectAnswer, showCelebration])

  // Play countdown sound for last 10 seconds
  useEffect(() => {
    if (timeRemaining === 10 || timeRemaining === 5 || timeRemaining === 3 || timeRemaining === 2 || timeRemaining === 1) {
      playCountdown()
    }
  }, [timeRemaining, playCountdown])

  const getOptionStyle = (option: string) => {
    if (!showResults) {
      return selectedAnswer === option
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background hover:bg-accent border-border'
    }

    // Show results
    if (option === correctAnswer) {
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
    }
    
    if (selectedAnswer === option && option !== correctAnswer) {
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    }

    return 'bg-muted text-muted-foreground border-border opacity-60'
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`question-${questionNumber}`}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      >
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="pb-4 sm:pb-6">
            <motion.div 
              className="flex items-center justify-between mb-2 sm:mb-0"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <Badge variant="secondary" className="text-xs sm:text-sm">
                Question {questionNumber} of {totalQuestions}
              </Badge>
              {timeRemaining !== undefined && !showResults && (
                <motion.div 
                  className="flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground"
                  animate={{ 
                    scale: timeRemaining <= 10 ? [1, 1.1, 1] : 1,
                    color: timeRemaining <= 10 ? '#ef4444' : undefined
                  }}
                  transition={{ 
                    scale: { duration: 0.5, repeat: timeRemaining <= 10 ? Infinity : 0 },
                    color: { duration: 0.3 }
                  }}
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">{timeRemaining}s</span>
                </motion.div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <CardTitle className="text-lg sm:text-xl leading-relaxed">
                {question.text}
              </CardTitle>
            </motion.div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="grid gap-2 sm:gap-3">
              {question.options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                >
                  <AnswerOption
                    option={option}
                    index={index}
                    isSelected={selectedAnswer === option}
                    isCorrect={showResults && option === correctAnswer}
                    isIncorrect={showResults && selectedAnswer === option && option !== correctAnswer}
                    showResults={showResults}
                    disabled={disabled}
                    onClick={() => onAnswerSelect?.(option)}
                  />
                </motion.div>
              ))}
            </div>

            <AnimatePresence>
              {showResults && question.explanation && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
                  className="sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <motion.h4 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="font-medium text-blue-900 dark:text-blue-100 mb-2 text-sm sm:text-base"
                  >
                    Explanation
                  </motion.h4>
                  <motion.p 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed"
                  >
                    {question.explanation}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Celebration confetti for correct answers */}
      <SimpleConfetti 
        isVisible={showConfetti} 
        duration={2000}
        onComplete={() => setShowConfetti(false)}
      />
    </AnimatePresence>
  )
}