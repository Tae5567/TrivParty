import { GameStateSync } from './game-state-sync'
import { calculateAnswerScore } from './scoring'
import type { Question, Player, GameState } from '@/types'

export interface GameFlowConfig {
  questionTimeLimit: number // seconds
  resultsDisplayTime: number // seconds
  autoAdvance: boolean
}

export class GameFlowManager {
  private gameStateSync: GameStateSync
  private config: GameFlowConfig
  private currentQuestionIndex: number = 0
  private questionTimer: NodeJS.Timeout | null = null
  private resultsTimer: NodeJS.Timeout | null = null
  private gamePhase: 'waiting' | 'question' | 'results' | 'complete' = 'waiting'

  constructor(sessionId: string, config: Partial<GameFlowConfig> = {}) {
    this.gameStateSync = new GameStateSync(sessionId)
    this.config = {
      questionTimeLimit: 30,
      resultsDisplayTime: 5,
      autoAdvance: true,
      ...config
    }
  }

  async initialize(): Promise<void> {
    await this.gameStateSync.initialize()
  }

  async startGame(questions: Question[]): Promise<void> {
    if (questions.length === 0) {
      throw new Error('Cannot start game with no questions')
    }

    // Update session status to active
    await this.gameStateSync.updateSessionStatus('active')
    
    // Start with first question
    this.currentQuestionIndex = 0
    await this.startQuestion(questions[0])
  }

  async startQuestion(question: Question): Promise<void> {
    this.gamePhase = 'question'
    
    // Update current question in database
    await this.gameStateSync.updateCurrentQuestion(question.id)
    
    // Broadcast question to all players
    await this.gameStateSync.broadcastQuestionChange(question, this.config.questionTimeLimit)
    
    // Start question timer
    if (this.config.autoAdvance) {
      this.startQuestionTimer()
    }
  }

  async revealAnswer(question: Question, playerAnswers: Record<string, string>): Promise<void> {
    this.gamePhase = 'results'
    
    // Clear question timer
    this.clearQuestionTimer()
    
    // Broadcast answer reveal
    await this.gameStateSync.broadcastAnswerReveal(
      question.id,
      question.correctAnswer,
      question.explanation
    )
    
    // Process all player answers and update scores
    await this.processPlayerAnswers(question, playerAnswers)
    
    // Start results timer
    if (this.config.autoAdvance) {
      this.startResultsTimer()
    }
  }

  async nextQuestion(questions: Question[]): Promise<void> {
    this.clearResultsTimer()
    
    this.currentQuestionIndex++
    
    if (this.currentQuestionIndex >= questions.length) {
      await this.completeGame()
    } else {
      await this.startQuestion(questions[this.currentQuestionIndex])
    }
  }

  async completeGame(): Promise<void> {
    this.gamePhase = 'complete'
    
    // Update session status to completed
    await this.gameStateSync.updateSessionStatus('completed')
    
    // Get final leaderboard
    const gameState = await this.gameStateSync.getCurrentGameState()
    if (gameState) {
      // Sort players by score for final leaderboard
      const finalScores = [...gameState.players].sort((a, b) => b.score - a.score)
      
      // Broadcast game completion
      await this.gameStateSync.broadcastGameComplete(finalScores)
    }
    
    // Clean up timers
    this.clearAllTimers()
  }

  async submitAnswer(
    playerId: string,
    questionId: string,
    selectedAnswer: string,
    correctAnswer: string,
    timeRemaining: number
  ): Promise<{
    isCorrect: boolean
    pointsEarned: number
    newScore: number
  }> {
    const isCorrect = selectedAnswer === correctAnswer
    const pointsEarned = isCorrect ? calculateAnswerScore(true, timeRemaining, this.config.questionTimeLimit) : 0
    
    // Record answer in database
    await this.gameStateSync.recordPlayerAnswer(playerId, questionId, selectedAnswer, isCorrect)
    
    // Get current player score
    const gameState = await this.gameStateSync.getCurrentGameState()
    const player = gameState?.players.find(p => p.id === playerId)
    const currentScore = player?.score || 0
    const newScore = currentScore + pointsEarned
    
    // Update player score
    await this.gameStateSync.updatePlayerScore(playerId, newScore)
    
    // Broadcast answer submission
    await this.gameStateSync.broadcastAnswerSubmitted({
      playerId,
      questionId,
      selectedAnswer,
      isCorrect,
      pointsEarned,
      newScore,
      timestamp: new Date().toISOString()
    })
    
    return {
      isCorrect,
      pointsEarned,
      newScore
    }
  }

  async forceNextQuestion(questions: Question[]): Promise<void> {
    if (this.gamePhase === 'question') {
      // Force reveal answers first
      const gameState = await this.gameStateSync.getCurrentGameState()
      const currentQuestion = questions[this.currentQuestionIndex]
      
      if (currentQuestion && gameState) {
        // Get all submitted answers for this question
        const questionAnswers = await this.gameStateSync.getQuestionAnswers(currentQuestion.id)
        const playerAnswers: Record<string, string> = {}
        
        questionAnswers.forEach(answer => {
          playerAnswers[answer.player_id] = answer.selected_answer
        })
        
        await this.revealAnswer(currentQuestion, playerAnswers)
      }
    } else if (this.gamePhase === 'results') {
      await this.nextQuestion(questions)
    }
  }

  async restartGame(): Promise<void> {
    // Clear all timers
    this.clearAllTimers()
    
    // Reset game state
    this.currentQuestionIndex = 0
    this.gamePhase = 'waiting'
    
    // Update session status to waiting
    await this.gameStateSync.updateSessionStatus('waiting')
    await this.gameStateSync.updateCurrentQuestion(null)
    
    // Reset all player scores
    const gameState = await this.gameStateSync.getCurrentGameState()
    if (gameState) {
      for (const player of gameState.players) {
        await this.gameStateSync.updatePlayerScore(player.id, 0)
      }
      
      // Broadcast reset state
      await this.gameStateSync.broadcastGameState({
        session: { ...gameState.session, status: 'waiting', currentQuestionId: undefined },
        players: gameState.players.map(p => ({ ...p, score: 0 })),
        currentQuestion: undefined,
        showResults: false
      })
    }
  }

  private async processPlayerAnswers(question: Question, playerAnswers: Record<string, string>): Promise<void> {
    const gameState = await this.gameStateSync.getCurrentGameState()
    if (!gameState) return
    
    // Process each player's answer
    for (const [playerId, selectedAnswer] of Object.entries(playerAnswers)) {
      const isCorrect = selectedAnswer === question.correctAnswer
      const pointsEarned = isCorrect ? calculateAnswerScore(true, 0, this.config.questionTimeLimit) : 0
      
      // Record answer if not already recorded
      await this.gameStateSync.recordPlayerAnswer(playerId, question.id, selectedAnswer, isCorrect)
      
      // Update score
      const player = gameState.players.find(p => p.id === playerId)
      if (player) {
        const newScore = player.score + pointsEarned
        await this.gameStateSync.updatePlayerScore(playerId, newScore)
      }
    }
  }

  private startQuestionTimer(): void {
    this.clearQuestionTimer()
    
    this.questionTimer = setTimeout(async () => {
      // Time's up - reveal answers
      const gameState = await this.gameStateSync.getCurrentGameState()
      if (gameState?.currentQuestion) {
        const questionAnswers = await this.gameStateSync.getQuestionAnswers(gameState.currentQuestion.id)
        const playerAnswers: Record<string, string> = {}
        
        questionAnswers.forEach(answer => {
          playerAnswers[answer.player_id] = answer.selected_answer
        })
        
        await this.revealAnswer(gameState.currentQuestion, playerAnswers)
      }
    }, this.config.questionTimeLimit * 1000)
  }

  private startResultsTimer(): void {
    this.clearResultsTimer()
    
    this.resultsTimer = setTimeout(async () => {
      // Auto-advance to next question or complete game
      const gameState = await this.gameStateSync.getCurrentGameState()
      if (gameState) {
        // Get all questions for this quiz
        const response = await fetch(`/api/quiz/${gameState.session.quizId}`)
        if (response.ok) {
          const data = await response.json()
          await this.nextQuestion(data.quiz.questions || [])
        }
      }
    }, this.config.resultsDisplayTime * 1000)
  }

  private clearQuestionTimer(): void {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer)
      this.questionTimer = null
    }
  }

  private clearResultsTimer(): void {
    if (this.resultsTimer) {
      clearTimeout(this.resultsTimer)
      this.resultsTimer = null
    }
  }

  private clearAllTimers(): void {
    this.clearQuestionTimer()
    this.clearResultsTimer()
  }

  getCurrentPhase(): string {
    return this.gamePhase
  }

  getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex
  }

  async cleanup(): Promise<void> {
    this.clearAllTimers()
    await this.gameStateSync.cleanup()
  }
}