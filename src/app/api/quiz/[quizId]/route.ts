import { NextRequest, NextResponse } from 'next/server'
import { getQuizById } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const { quizId } = params

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      )
    }

    const quiz = await getQuizById(quizId)

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      quiz
    })

  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}