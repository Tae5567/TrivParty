import { NextRequest, NextResponse } from 'next/server'
import { replayService } from '@/lib/replay'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Generate replay data from session
    const replayData = await replayService.generateReplayFromSession(sessionId)
    
    if (!replayData) {
      return NextResponse.json(
        { error: 'Failed to generate replay data from session' },
        { status: 404 }
      )
    }

    // Create the replay
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
        shareUrl: replayService.generateShareableUrl(replay.replayCode),
        socialUrls: replayService.generateSocialShareUrls(replay.replayCode, replay.title)
      }
    })
  } catch (error) {
    console.error('Error generating replay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}