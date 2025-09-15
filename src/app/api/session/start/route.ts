import { NextRequest, NextResponse } from 'next/server'
import { getSessionById, updateSessionStatus, getPlayersBySessionId, getQuizById } from '@/lib/database'
import { z } from 'zod'

const startSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  hostId: z.string().min(1, 'Host ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = startSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { sessionId, hostId } = validation.data

    // Get session
    const session = await getSessionById(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify host authorization
    if (session.hostId !== hostId) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the host can start the session' },
        { status: 403 }
      )
    }

    // Check if session is in correct state
    if (session.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Session cannot be started in current state' },
        { status: 400 }
      )
    }

    // Check if there are players in the session
    const players = await getPlayersBySessionId(sessionId)
    if (players.length === 0) {
      return NextResponse.json(
        { error: 'Cannot start session with no players' },
        { status: 400 }
      )
    }

    // Verify quiz exists and has questions
    const quiz = await getQuizById(session.quizId)
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      return NextResponse.json(
        { error: 'Quiz not found or has no questions' },
        { status: 400 }
      )
    }

    // Update session status to active
    await updateSessionStatus(sessionId, 'active')

    return NextResponse.json({
      success: true,
      sessionId,
      playerCount: players.length,
      questionCount: quiz.questions.length
    })

  } catch (error) {
    console.error('Session start error:', error)
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    )
  }
}