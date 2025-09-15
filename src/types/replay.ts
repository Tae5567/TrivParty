export interface ReplayPlayerScore {
  playerId: string
  nickname: string
  score: number
  rank: number
  userId?: string
}

export interface ReplayQuestionResult {
  questionId: string
  questionText: string
  options: string[]
  correctAnswer: string
  explanation: string
  questionOrder: number
  playerAnswers: {
    playerId: string
    nickname: string
    selectedAnswer: string
    isCorrect: boolean
    answeredAt: string
    timeTaken?: number
  }[]
}

export interface GameReplay {
  id: string
  sessionId: string
  replayCode: string
  title: string
  quizTitle: string
  totalQuestions: number
  totalPlayers: number
  sessionDurationSeconds?: number
  finalScores: ReplayPlayerScore[]
  questionResults: ReplayQuestionResult[]
  createdAt: string
  expiresAt: string
  isPublic: boolean
  viewCount: number
}

export interface ReplayShare {
  id: string
  replayId: string
  platform: 'twitter' | 'facebook' | 'linkedin' | 'copy_link'
  sharedAt: string
  sharedByIp?: string
}

export interface CreateReplayData {
  sessionId: string
  title: string
  quizTitle: string
  totalQuestions: number
  totalPlayers: number
  sessionDurationSeconds?: number
  finalScores: ReplayPlayerScore[]
  questionResults: ReplayQuestionResult[]
  isPublic?: boolean
}

export interface ShareReplayData {
  replayId: string
  platform: ReplayShare['platform']
  sharedByIp?: string
}