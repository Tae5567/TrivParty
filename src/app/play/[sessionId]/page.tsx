'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { GameController } from '@/components/GameController'
import { SessionLobby } from '@/components/SessionLobby'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { GameStateSync } from '@/lib/game-state-sync'
import { RealtimeProvider } from '@/contexts/RealtimeProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Trophy } from 'lucide-react'
import type { GameState, Question, Quiz } from '@/types'

interface GamePageProps {
  searchParams: { playerId?: string; isHost?: string; hostId?: string }
}

export default function GamePage({ searchParams }: GamePageProps) {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const playerId = searchParams.playerId || searchParams.hostId
  const isHost = searchParams.isHost === 'true'

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameStateSync, setGameStateSync] = useState<GameStateSync | null>(null)
  const [gamePhase, setGamePhase] = useState<'lobby' | 'playing' | 'completed'>('lobby')
  const cleanupRef = useRef<(() => void) | null>(null)

  // Initialize game state sync
  useEffect(() => {
    if (!sessionId) return

    const initializeSync = async () => {
      try {
        const sync = new GameStateSync(sessionId)
        await sync.initialize()
        setGameStateSync(sync)
        cleanupRef.current = () => sync.cleanup()

        // Load initial game state
        const initialState = await sync.getCurrentGameState()
        if (initialState) {
          setGameState(initialState)
          setGamePhase(
            initialState.session.status === 'waiting' ? 'lobby' :
            initialState.session.status === 'active' ? 'playing' :
            'completed'
          )
        }

        // Load quiz questions
        await loadQuizQuestions(initialState?.session.quizId)
        
        setLoading(false)
      } catch (err) {
        console.error('Failed to initialize game:', err)
        setError('Failed to connect to game session')
        setLoading(false)
      }
    }

    initializeSync()

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [sessionId])

  // Set up real-time event listeners
  useEffect(() => {
    if (!gameStateSync) return

    // Listen for game state changes
    gameStateSync.onGameStateChange((payload) => {
      if (payload.payload.gameState) {
        setGameState(prev => ({
          ...prev,
          ...payload.payload.gameState
        }))
      }
    })

    // Listen for question changes
    gameStateSync.onQuestionChange((payload) => {
      if (payload.payload.question) {
        setGameState(prev => prev ? {
          ...prev,
          currentQuestion: payload.payload.question,
          timeRemaining: payload.payload.timeRemaining,
          showResults: false
        } : null)
      }
    })

    // Listen for answer reveals
    gameStateSync.onAnswerReveal(() => {
      setGameState(prev => prev ? {
        ...prev,
        showResults: true
      } : null)
    })

    // Listen for answer submissions (score updates)
    gameStateSync.onAnswerSubmitted((payload) => {
      const { playerId: answeredPlayerId, newScore } = payload.payload
      setGameState(prev => {
        if (!prev) return null
        
        return {
          ...prev,
          players: prev.players.map(player =>
            player.id === answeredPlayerId
              ? { ...player, score: newScore }
              : player
          )
        }
      })
    })

    // Listen for game completion
    gameStateSync.onGameComplete((payload) => {
      setGameState(prev => prev ? {
        ...prev,
        session: { ...prev.session, status: 'completed' },
        players: payload.payload.finalScores
      } : null)
      setGamePhase('completed')
    })

  }, [gameStateSync])

  const loadQuizQuestions = async (quizId?: string) => {
    if (!quizId) return

    try {
      const response = await fetch(`/api/quiz/${quizId}`)
      if (!response.ok) throw new Error('Failed to load quiz')
      
      const data = await response.json()
      setQuiz(data.quiz)
      setQuestions(data.quiz.questions || [])
    } catch (err) {
      console.error('Failed to load quiz questions:', err)
      setError('Failed to load quiz questions')
    }
  }

  const handleStartGame = async () => {
    if (!gameState || !isHost) return

    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameState.session.id,
          hostId: gameState.session.hostId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start game')
      }

      // Update session status and start first question
      await gameStateSync?.updateSessionStatus('active')
      if (questions.length > 0) {
        await gameStateSync?.updateCurrentQuestion(questions[0].id)
        await gameStateSync?.broadcastQuestionChange(questions[0], 30)
      }
      
      setGamePhase('playing')
    } catch (err) {
      console.error('Failed to start game:', err)
      setError(err instanceof Error ? err.message : 'Failed to start game')
    }
  }

  const handleAnswerSubmit = async (questionId: string, selectedAnswer: string) => {
    if (!playerId || !gameState) return

    const currentQuestion = questions.find(q => q.id === questionId)
    if (!currentQuestion) return

    try {
      const response = await fetch('/api/game/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          questionId,
          selectedAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          sessionId: gameState.session.id,
          timeRemaining: gameState.timeRemaining || 0
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit answer')
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setError('Failed to submit answer')
    }
  }

  const handleNextQuestion = async () => {
    if (!gameState || !isHost) return

    const currentIndex = questions.findIndex(q => q.id === gameState.currentQuestion?.id)
    const nextIndex = currentIndex + 1

    if (nextIndex < questions.length) {
      const nextQuestion = questions[nextIndex]
      await gameStateSync?.updateCurrentQuestion(nextQuestion.id)
      await gameStateSync?.broadcastQuestionChange(nextQuestion, 30)
    } else {
      await handleGameComplete()
    }
  }

  const handleGameComplete = async () => {
    if (!gameState || !gameStateSync) return

    try {
      await gameStateSync.updateSessionStatus('completed')
      await gameStateSync.broadcastGameComplete(gameState.players)
      setGamePhase('completed')
    } catch (err) {
      console.error('Failed to complete game:', err)
      setError('Failed to complete game')
    }
  }

  const handleRestartGame = async () => {
    if (!gameState || !isHost || !gameStateSync) return

    try {
      // Reset session to waiting status
      await gameStateSync.updateSessionStatus('waiting')
      await gameStateSync.updateCurrentQuestion(null)
      
      // Reset all player scores
      for (const player of gameState.players) {
        await gameStateSync.updatePlayerScore(player.id, 0)
      }

      // Broadcast game state reset
      await gameStateSync.broadcastGameState({
        session: { ...gameState.session, status: 'waiting', currentQuestionId: undefined },
        players: gameState.players.map(p => ({ ...p, score: 0 })),
        currentQuestion: undefined,
        showResults: false
      })

      setGamePhase('lobby')
    } catch (err) {
      console.error('Failed to restart game:', err)
      setError('Failed to restart game')
    }
  }

  const handleLeaveGame = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-muted-foreground">Loading game session...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-red-600">{error}</p>
              <Button onClick={handleLeaveGame} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Game session not found</p>
              <Button onClick={handleLeaveGame} variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Button 
              onClick={handleLeaveGame} 
              variant="outline" 
              size="sm"
              className="gap-1 sm:gap-2"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Leave Game</span>
              <span className="sm:hidden">Leave</span>
            </Button>
            
            <div className="text-center">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                {gameState.session.joinCode}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Session Code
              </p>
            </div>

            <div className="w-16 sm:w-24" /> {/* Spacer for centering */}
          </div>

          {/* Game Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              {gamePhase === 'lobby' && quiz && (
                <SessionLobby
                  session={gameState.session}
                  quiz={quiz}
                  players={gameState.players}
                  isHost={isHost}
                  onStartGame={handleStartGame}
                />
              )}

              {gamePhase === 'playing' && (
                <GameController
                  questions={questions}
                  players={gameState.players}
                  isHost={isHost}
                  playerId={playerId}
                  onAnswerSubmit={handleAnswerSubmit}
                  onNextQuestion={handleNextQuestion}
                  onGameComplete={handleGameComplete}
                  onRestartGame={handleRestartGame}
                  gameState={gameState}
                />
              )}

              {gamePhase === 'completed' && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-6">
                      <div className="flex justify-center">
                        <Trophy className="h-16 w-16 text-yellow-500" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          Game Complete!
                        </h2>
                        <p className="text-muted-foreground">
                          Thanks for playing! Check out the final results below.
                        </p>
                      </div>
                      
                      <div className="max-w-md mx-auto">
                        <Leaderboard 
                          players={gameState.players}
                          title="Final Results"
                          showStats={true}
                          isFinal={true}
                          currentPlayerId={playerId}
                          showCelebration={true}
                          onPlayAgain={isHost ? handleRestartGame : undefined}
                          onNewQuiz={isHost ? handleLeaveGame : undefined}
                        />
                      </div>

                      {isHost && (
                        <div className="flex gap-4 justify-center">
                          <Button onClick={handleRestartGame} className="gap-2">
                            Play Again
                          </Button>
                          <Button onClick={handleLeaveGame} variant="outline" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Home
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 order-1 lg:order-2">
              {/* Current Scores - Compact on mobile */}
              <div className="lg:block">
                <ScoreDisplay 
                  players={gameState.players}
                  currentPlayerId={playerId}
                  compact={true}
                  className="lg:hidden"
                />
                <div className="hidden lg:block">
                  <ScoreDisplay 
                    players={gameState.players}
                    currentPlayerId={playerId}
                  />
                </div>
              </div>

              {/* Live Leaderboard - Hidden on mobile during gameplay */}
              {gamePhase === 'playing' && (
                <div className="hidden lg:block">
                  <Leaderboard 
                    players={gameState.players}
                    title="Current Standings"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RealtimeProvider>
  )
}