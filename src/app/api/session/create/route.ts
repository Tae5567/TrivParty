import { NextRequest, NextResponse } from 'next/server'
import { createSession, getQuizById } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const createSessionSchema = z.object({
  quizId: z.string().uuid('Invalid quiz ID format'),
  hostId: z.string().min(1, 'Host ID is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = createSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { quizId, hostId } = validation.data

    // Check if user is authenticated (optional)
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          userId = user.id
        }
      } catch (error) {
        // Authentication is optional for session creation
        console.log('Optional auth failed:', error)
      }
    }

    // Verify quiz exists
    const quiz = await getQuizById(quizId)
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Verify quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      return NextResponse.json(
        { error: 'Quiz has no questions' },
        { status: 400 }
      )
    }

    // Create session with optional user ID
    const session = await createSession(quizId, hostId, userId)

    return NextResponse.json({
      session: {
        id: session.id,
        joinCode: session.joinCode,
        quizId: session.quizId,
        hostId: session.hostId,
        status: session.status
      }
    })

  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}