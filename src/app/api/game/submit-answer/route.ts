import { NextRequest, NextResponse } from 'next/server'
import { submitAnswerAndUpdateScore } from '@/lib/scoring'
import { GameStateSync } from '@/lib/game-state-sync'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      playerId, 
      questionId, 
      selectedAnswer, 
      correctAnswer, 
      sessionId,
      timeRemaining 
    } = body

    // Validate required fields
    if (!playerId || !questionId || !selectedAnswer || !correctAnswer || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Submit answer and update score
    const result = await submitAnswerAndUpdateScore(
      playerId,
      questionId,
      selectedAnswer,
      correctAnswer,
      timeRemaining
    )

    // Broadcast score update to all players in the session
    const gameStateSync = new GameStateSync(sessionId)
    await gameStateSync.initialize()
    
    // Broadcast the answer submission and score update
    await gameStateSync.broadcastAnswerSubmitted({
      playerId,
      questionId,
      selectedAnswer,
      isCorrect: result.answer.isCorrect,
      pointsEarned: result.pointsEarned,
      newScore: result.newScore,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      answer: result.answer,
      newScore: result.newScore,
      pointsEarned: result.pointsEarned,
      isCorrect: result.answer.isCorrect,
      hasDoublePoints: result.hasDoublePoints
    })

  } catch (error) {
    console.error('Error submitting answer:', error)
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    )
  }
}