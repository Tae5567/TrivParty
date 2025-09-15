import { NextRequest, NextResponse } from 'next/server'
import { replayService } from '@/lib/replay'

export async function GET(
  request: NextRequest,
  { params }: { params: { replayCode: string } }
) {
  try {
    const { replayCode } = params
    
    if (!replayCode) {
      return NextResponse.json(
        { error: 'Replay code is required' },
        { status: 400 }
      )
    }

    const replay = await replayService.getReplayByCode(replayCode)
    
    if (!replay) {
      return NextResponse.json(
        { error: 'Replay not found or expired' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      replay
    })
  } catch (error) {
    console.error('Error fetching replay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}