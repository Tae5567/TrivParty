import { NextRequest, NextResponse } from 'next/server'
import { GameFlowManager } from '@/lib/game-flow-manager'
import { getQuizById } from '@/lib/database'
import { z } from 'zod'

const gameFlowSchema = z.object({
  action: z.enum(['start', 'next', 'reveal', 'complete', 'restart']),
  sessionId: z.string().uuid(),
  hostId: z.string().min(1),
  questionId: z.string().uuid().optional(),
  playerAnswers: z.record(z.string()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = gameFlowSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { action, sessionId, hostId, questionId, playerAnswers } = validation.data

    // Initialize game flow manager
    const gameFlowManager = new GameFlowManager(sessionId)
    await gameFlowManager.initialize()

    // Verify host authorization
    const gameState = await gameFlowManager['gameStateSync'].getCurrentGameState()
    if (!gameState || gameState.session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the host can control game flow' },
        { status: 403 }
      )
    }

    let result: any = { success: true }

    switch (action) {
      case 'start':
        // Get quiz questions
        const quiz = await getQuizById(gameState.session.quizId)
        if (!quiz || !quiz.questions || quiz.questions.length === 0) {
          return NextResponse.json(
            { error: 'Quiz not found or has no questions' },
            { status: 400 }
          )
        }
        
        await gameFlowManager.startGame(quiz.questions)
        result.message = 'Game started successfully'
        result.questionCount = quiz.questions.length
        break

      case 'next':
        // Get quiz questions for next question
        const nextQuiz = await getQuizById(gameState.session.quizId)
        if (!nextQuiz?.questions) {
          return NextResponse.json(
            { error: 'Quiz questions not found' },
            { status: 400 }
          )
        }
        
        await gameFlowManager.nextQuestion(nextQuiz.questions)
        result.message = 'Advanced to next question'
        break

      case 'reveal':
        if (!questionId) {
          return NextResponse.json(
            { error: 'Question ID required for reveal action' },
            { status: 400 }
          )
        }
        
        // Get question details
        const revealQuiz = await getQuizById(gameState.session.quizId)
        const question = revealQuiz?.questions?.find(q => q.id === questionId)
        
        if (!question) {
          return NextResponse.json(
            { error: 'Question not found' },
            { status: 404 }
          )
        }
        
        await gameFlowManager.revealAnswer(question, playerAnswers || {})
        result.message = 'Answer revealed'
        result.correctAnswer = question.correctAnswer
        result.explanation = question.explanation
        break

      case 'complete':
        await gameFlowManager.completeGame()
        result.message = 'Game completed'
        break

      case 'restart':
        await gameFlowManager.restartGame()
        result.message = 'Game restarted'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Clean up
    await gameFlowManager.cleanup()

    return NextResponse.json(result)

  } catch (error) {
    console.error('Game flow error:', error)
    return NextResponse.json(
      { error: 'Failed to execute game flow action' },
      { status: 500 }
    )
  }
}