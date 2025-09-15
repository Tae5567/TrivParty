import { NextRequest, NextResponse } from 'next/server'
import { replayService } from '@/lib/replay'
import { CreateReplayData } from '@/types/replay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { sessionId, title, quizTitle, totalQuestions, totalPlayers, finalScores, questionResults } = body
    
    if (!sessionId || !title || !quizTitle || !totalQuestions || !totalPlayers || !finalScores || !questionResults) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const replayData: CreateReplayData = {
      sessionId,
      title,
      quizTitle,
      totalQuestions,
      totalPlayers,
      sessionDurationSeconds: body.sessionDurationSeconds,
      finalScores,
      questionResults,
      isPublic: body.isPublic ?? true
    }

    const replay = await replayService.createReplay(replayData)
    
    if (!replay) {
      return NextResponse.json(
        { error: 'Failed to create replay' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      replay: {
        id: replay.id,
        replayCode: replay.replayCode,
        title: replay.title,
        shareUrl: replayService.generateShareableUrl(replay.replayCode)
      }
    })
  } catch (error) {
    console.error('Error creating replay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}