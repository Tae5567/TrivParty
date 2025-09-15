// Core application types based on the design document

export interface Quiz {
  id: string
  sourceUrl: string
  title: string
  createdAt: string
  questions: Question[]
}

export interface Question {
  id: string
  quizId: string
  text: string
  options: string[]
  correctAnswer: string
  explanation: string
  questionOrder: number
}

export interface Session {
  id: string
  quizId: string
  hostId: string
  joinCode: string
  status: 'waiting' | 'active' | 'completed'
  currentQuestionId?: string
  createdAt: string
}

export interface Player {
  id: string
  sessionId: string
  nickname: string
  score: number
  joinedAt: string
}

export interface PlayerAnswer {
  id: string
  playerId: string
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  answeredAt: string
}

export interface GameState {
  session: Session
  players: Player[]
  currentQuestion?: Question
  timeRemaining?: number
  showResults: boolean
}

// API Response types
export interface ContentExtractionResponse {
  content: string
  title: string
}

export interface QuizGenerationResponse {
  quiz: {
    id: string
    questions: Array<{
      id: string
      text: string
      options: string[]
      correctAnswer: string
      explanation: string
    }>
  }
}

export interface SessionCreationResponse {
  sessionId: string
  joinCode: string
}

export interface PlayerJoinResponse {
  playerId: string
  playerToken: string
}

// Content source types
export type ContentSource = 'wikipedia' | 'youtube'

export interface ContentExtractionRequest {
  url: string
  source?: ContentSource
}

export interface QuizGenerationRequest {
  content: string
  questionCount?: number
  title?: string
}

// Power-up types
export interface PowerUp {
  id: string
  name: string
  description: string
  icon: string
  maxUsesPerGame: number
  createdAt: string
}

export interface PlayerPowerUp {
  id: string
  playerId: string
  powerUpId: string
  usesRemaining: number
  createdAt: string
  powerUp?: PowerUp
}

export interface PowerUpUsage {
  id: string
  playerId: string
  powerUpId: string
  questionId: string
  usedAt: string
}

export type PowerUpType = 'skip_question' | 'double_points' | 'fifty_fifty'

export interface PowerUpState {
  skipQuestion: PlayerPowerUp | null
  doublePoints: PlayerPowerUp | null
  fiftyFifty: PlayerPowerUp | null
}