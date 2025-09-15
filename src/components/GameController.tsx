'use client'

import { useState, useEffect, useCallback } from 'react'
import { Question, Player, GameState } from '@/types'
import { QuestionDisplay } from './QuestionDisplay'
import { AnswerSubmission } from './AnswerSubmission'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { useGameSounds } from '@/hooks/useSoundEffects'
import { SimpleConfetti } from '@/components/ui/Confetti'

interface GameControllerProps {
  questions: Question[]
  players: Player[]
  isHost?: boolean
  playerId?: string
  onAnswerSubmit?: (questionId: string, answer: string) => void
  onNextQuestion?: () => void
  onGameComplete?: () => void
  onRestartGame?: () => void
  gameState?: GameState
}

const QUESTION_TIME_LIMIT = 30 // seconds
const RESULTS_DISPLAY_TIME = 5 // seconds

export function GameController({
  questions,
  players,
  isHost = false,
  playerId,
  onAnswerSubmit,
  onNextQuestion,
  onGameComplete,
  onRestartGame,
  gameState
}: GameControllerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT)
  const [showResults, setShowResults] = useState(false)
  const [playerAnswers, setPlayerAnswers] = useState<Record<string, string>>({})
  const [gamePhase, setGamePhase] = useState<'question' | 'results' | 'complete'>('question')
  const [resultsTimer, setResultsTimer] = useState(RESULTS_DISPLAY_TIME)
  const [showCelebration, setShowCelebration] = useState(false)
  
  const { playGameStart, playGameEnd } = useGameSounds()

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const playersAnswered = Object.keys(playerAnswers).length
  const allPlayersAnswered = playersAnswered === players.length

  // Timer for question time limit
  useEffect(() => {
    if (gamePhase !== 'question' || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setGamePhase('results')
          setShowResults(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase, timeRemaining])

  // Timer for results display
  useEffect(() => {
    if (gamePhase !== 'results' || resultsTimer <= 0) return

    const timer = setInterval(() => {
      setResultsTimer(prev => {
        if (prev <= 1) {
          handleNextQuestion()
          return RESULTS_DISPLAY_TIME
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase, resultsTimer])

  // Auto-advance when all players have answered
  useEffect(() => {
    if (gamePhase === 'question' && allPlayersAnswered && players.length > 0) {
      setGamePhase('results')
      setShowResults(true)
    }
  }, [allPlayersAnswered, gamePhase, players.length])

  const handleAnswerSubmit = useCallback((answer: string) => {
    if (!currentQuestion || !playerId) return

    setPlayerAnswers(prev => ({
      ...prev,
      [playerId]: answer
    }))

    onAnswerSubmit?.(currentQuestion.id, answer)
  }, [currentQuestion, playerId, onAnswerSubmit])

  const handleNextQuestion = useCallback(() => {
    if (isLastQuestion) {
      setGamePhase('complete')
      playGameEnd()
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
      onGameComplete?.()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setTimeRemaining(QUESTION_TIME_LIMIT)
      setShowResults(false)
      setPlayerAnswers({})
      setGamePhase('question')
      setResultsTimer(RESULTS_DISPLAY_TIME)
      onNextQuestion?.()
    }
  }, [isLastQuestion, onGameComplete, onNextQuestion, playGameEnd])

  // Sync with external game state if provided
  useEffect(() => {
    if (gameState?.currentQuestion) {
      const questionIndex = questions.findIndex(q => q.id === gameState.currentQuestion?.id)
      if (questionIndex !== -1 && questionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(questionIndex)
        setTimeRemaining(gameState.timeRemaining || QUESTION_TIME_LIMIT)
        setShowResults(gameState.showResults || false)
        setGamePhase(gameState.showResults ? 'results' : 'question')
      }
    }
  }, [gameState?.currentQuestion, gameState?.timeRemaining, gameState?.showResults, questions, currentQuestionIndex])

  const handleManualNext = () => {
    if (isHost) {
      handleNextQuestion()
    }
  }

  const handleRestart = () => {
    setCurrentQuestionIndex(0)
    setTimeRemaining(QUESTION_TIME_LIMIT)
    setShowResults(false)
    setPlayerAnswers({})
    setGamePhase('question')
    setResultsTimer(RESULTS_DISPLAY_TIME)
    setShowCelebration(false)
    playGameStart()
    onRestartGame?.()
  }

  const progress = ((currentQuestionIndex + (gamePhase === 'results' ? 1 : 0)) / questions.length) * 100

  if (!currentQuestion) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No questions available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gamePhase === 'complete') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-2xl font-bold">Game Complete!</h2>
            <p className="text-muted-foreground">
              All questions have been answered. Check the final leaderboard!
            </p>
            {isHost && (
              <Button onClick={handleRestart} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Start New Game
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Game completion celebration */}
      <SimpleConfetti 
        isVisible={showCelebration} 
        duration={3000}
        onComplete={() => setShowCelebration(false)}
      />
      
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question Display */}
      {gamePhase === 'question' && (
        <AnswerSubmission
          question={currentQuestion}
          onSubmitAnswer={handleAnswerSubmit}
          timeRemaining={timeRemaining}
          playersAnswered={playersAnswered}
          totalPlayers={players.length}
          disabled={timeRemaining <= 0}
          submitted={playerId ? playerId in playerAnswers : false}
          playerId={playerId}
          onSkipQuestion={() => {
            // Mark as answered with a special skip value
            if (playerId) {
              setPlayerAnswers(prev => ({
                ...prev,
                [playerId]: '__SKIPPED__'
              }))
            }
          }}
        />
      )}

      {/* Results Display */}
      {gamePhase === 'results' && (
        <div className="space-y-4">
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            showResults={true}
            correctAnswer={currentQuestion.correctAnswer}
            selectedAnswer={playerId ? playerAnswers[playerId] : undefined}
            showCelebration={true}
          />

          {/* Results Timer and Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {isLastQuestion ? 'Game completing' : 'Next question'} in {resultsTimer}s
                </div>
                
                {isHost && (
                  <Button onClick={handleManualNext} className="gap-2">
                    {isLastQuestion ? 'Complete Game' : 'Next Question'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}