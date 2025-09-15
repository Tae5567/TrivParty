import { createClientComponentClient } from '@/lib/supabase'
import type { GameState, Session, Player, Question } from '@/types'
import type { Database } from '@/types/database'

export class GameStateSync {
  private supabase = createClientComponentClient()
  private sessionId: string
  private channel: any

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  // Initialize real-time synchronization for a session
  async initialize(): Promise<void> {
    this.channel = this.supabase.channel(`game_state:${this.sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: this.sessionId },
      },
    })

    await this.channel.subscribe()
  }

  // Broadcast game state changes to all clients
  async broadcastGameState(gameState: Partial<GameState>): Promise<void> {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'game_state_sync',
      payload: {
        sessionId: this.sessionId,
        gameState,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Broadcast question change to all clients
  async broadcastQuestionChange(question: Question, timeRemaining?: number): Promise<void> {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'question_changed',
      payload: {
        sessionId: this.sessionId,
        question,
        timeRemaining,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Broadcast answer reveal to all clients
  async broadcastAnswerReveal(questionId: string, correctAnswer: string, explanation: string): Promise<void> {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'answer_reveal',
      payload: {
        sessionId: this.sessionId,
        questionId,
        correctAnswer,
        explanation,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Broadcast answer submission and score update to all clients
  async broadcastAnswerSubmitted(data: {
    playerId: string
    questionId: string
    selectedAnswer: string
    isCorrect: boolean
    pointsEarned: number
    newScore: number
    timestamp: string
  }): Promise<void> {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'answer_submitted',
      payload: {
        sessionId: this.sessionId,
        ...data,
      },
    })
  }

  // Broadcast game completion to all clients
  async broadcastGameComplete(finalScores: Player[]): Promise<void> {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    await this.channel.send({
      type: 'broadcast',
      event: 'game_complete',
      payload: {
        sessionId: this.sessionId,
        finalScores,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Get current game state from database
  async getCurrentGameState(): Promise<GameState | null> {
    try {
      // Fetch session data
      const { data: session, error: sessionError } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('id', this.sessionId)
        .single()

      if (sessionError || !session) {
        throw new Error(`Session not found: ${sessionError?.message}`)
      }

      // Fetch players
      const { data: players, error: playersError } = await this.supabase
        .from('players')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('score', { ascending: false })

      if (playersError) {
        throw new Error(`Failed to fetch players: ${playersError.message}`)
      }

      // Fetch current question if exists
      let currentQuestion: Question | undefined
      if (session.current_question_id) {
        const { data: question, error: questionError } = await this.supabase
          .from('questions')
          .select('*')
          .eq('id', session.current_question_id)
          .single()

        if (!questionError && question) {
          currentQuestion = {
            id: question.id,
            quizId: question.quiz_id,
            text: question.text,
            options: question.options as string[],
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
            questionOrder: question.question_order,
          }
        }
      }

      const gameState: GameState = {
        session: {
          id: session.id,
          quizId: session.quiz_id,
          hostId: session.host_id,
          joinCode: session.join_code,
          status: session.status as 'waiting' | 'active' | 'completed',
          currentQuestionId: session.current_question_id || undefined,
          createdAt: session.created_at,
        },
        players: players || [],
        currentQuestion,
        showResults: false,
      }

      return gameState
    } catch (error) {
      console.error('Error fetching game state:', error)
      return null
    }
  }

  // Update session status in database
  async updateSessionStatus(status: 'waiting' | 'active' | 'completed'): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({ status })
      .eq('id', this.sessionId)

    if (error) {
      throw new Error(`Failed to update session status: ${error.message}`)
    }
  }

  // Update current question in database
  async updateCurrentQuestion(questionId: string | null): Promise<void> {
    const { error } = await this.supabase
      .from('sessions')
      .update({ current_question_id: questionId })
      .eq('id', this.sessionId)

    if (error) {
      throw new Error(`Failed to update current question: ${error.message}`)
    }
  }

  // Update player score in database
  async updatePlayerScore(playerId: string, newScore: number): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .update({ score: newScore })
      .eq('id', playerId)

    if (error) {
      throw new Error(`Failed to update player score: ${error.message}`)
    }
  }

  // Record player answer in database
  async recordPlayerAnswer(
    playerId: string,
    questionId: string,
    selectedAnswer: string,
    isCorrect: boolean
  ): Promise<void> {
    const { error } = await this.supabase
      .from('player_answers')
      .insert({
        player_id: playerId,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
      })

    if (error) {
      throw new Error(`Failed to record player answer: ${error.message}`)
    }
  }

  // Get all answers for a specific question
  async getQuestionAnswers(questionId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('player_answers')
      .select(`
        *,
        players!inner(nickname)
      `)
      .eq('question_id', questionId)

    if (error) {
      throw new Error(`Failed to fetch question answers: ${error.message}`)
    }

    return data || []
  }

  // Subscribe to game state changes
  onGameStateChange(callback: (gameState: any) => void): void {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    this.channel.on('broadcast', { event: 'game_state_sync' }, callback)
  }

  // Subscribe to question changes
  onQuestionChange(callback: (data: any) => void): void {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    this.channel.on('broadcast', { event: 'question_changed' }, callback)
  }

  // Subscribe to answer reveals
  onAnswerReveal(callback: (data: any) => void): void {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    this.channel.on('broadcast', { event: 'answer_reveal' }, callback)
  }

  // Subscribe to answer submissions
  onAnswerSubmitted(callback: (data: any) => void): void {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    this.channel.on('broadcast', { event: 'answer_submitted' }, callback)
  }

  // Subscribe to game completion
  onGameComplete(callback: (data: any) => void): void {
    if (!this.channel) {
      throw new Error('GameStateSync not initialized')
    }

    this.channel.on('broadcast', { event: 'game_complete' }, callback)
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }
  }
}