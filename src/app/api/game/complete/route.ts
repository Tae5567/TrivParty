import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { recordGameHistory } from '@/lib/database'
import { checkAndAwardAchievements } from '@/lib/achievements'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, playerId, finalScore, finalRank, questionsAnswered, correctAnswers, completionTime } = await request.json()

    if (!sessionId || !playerId || finalScore === undefined || finalRank === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get player information
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('user_id, nickname')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Only record history for authenticated users
    if (player.user_id) {
      try {
        // Record game history
        await recordGameHistory(
          player.user_id,
          sessionId,
          finalScore,
          finalRank,
          questionsAnswered,
          correctAnswers,
          completionTime
        )

        // Check for achievements
        const gameData = {
          correctAnswers,
          totalQuestions: questionsAnswered,
          completionTime,
          finalRank,
          wasLastPlace: false, // This would need to be calculated based on game state
        }

        const newAchievements = await checkAndAwardAchievements(player.user_id, gameData)

        return NextResponse.json({ 
          success: true,
          newAchievements: newAchievements && newAchievements.length > 0 ? newAchievements : undefined
        })
      } catch (error) {
        console.error('Error recording game completion:', error)
        // Don't fail the request if history recording fails
        return NextResponse.json({ success: true, warning: 'Failed to record game history' })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Game completion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}