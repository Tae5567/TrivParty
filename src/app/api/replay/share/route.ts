import { NextRequest, NextResponse } from 'next/server'
import { replayService } from '@/lib/replay'
import { ShareReplayData } from '@/types/replay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { replayId, platform } = body
    
    if (!replayId || !platform) {
      return NextResponse.json(
        { error: 'Replay ID and platform are required' },
        { status: 400 }
      )
    }

    // Validate platform
    const validPlatforms = ['twitter', 'facebook', 'linkedin', 'copy_link']
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      )
    }

    // Get client IP for tracking
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip')

    const shareData: ShareReplayData = {
      replayId,
      platform,
      sharedByIp: ip || undefined
    }

    const success = await replayService.recordShare(shareData)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record share' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Share recorded successfully'
    })
  } catch (error) {
    console.error('Error recording share:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}