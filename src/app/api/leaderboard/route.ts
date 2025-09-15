import { NextRequest, NextResponse } from 'next/server'
import { getGlobalLeaderboard } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (limit > 100) {
      return NextResponse.json({ error: 'Limit cannot exceed 100' }, { status: 400 })
    }

    const leaderboard = await getGlobalLeaderboard(limit)

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}