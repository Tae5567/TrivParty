import { NextRequest, NextResponse } from 'next/server'
import { getSessionLeaderboard } from '@/lib/scoring'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const leaderboard = await getSessionLeaderboard(sessionId)

    return NextResponse.json({
      success: true,
      leaderboard
    })

  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}