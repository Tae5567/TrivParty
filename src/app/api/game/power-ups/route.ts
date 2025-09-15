import { NextRequest, NextResponse } from 'next/server'
import { usePowerUp, getPlayerPowerUps, initializePlayerPowerUps } from '@/lib/power-ups'
import type { PowerUpType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, playerId, powerUpType, questionId } = body

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'use':
        if (!powerUpType || !questionId) {
          return NextResponse.json(
            { error: 'Power-up type and question ID are required for use action' },
            { status: 400 }
          )
        }

        const result = await usePowerUp(playerId, powerUpType as PowerUpType, questionId)
        return NextResponse.json(result)

      case 'initialize':
        await initializePlayerPowerUps(playerId)
        const initializedPowerUps = await getPlayerPowerUps(playerId)
        return NextResponse.json({ 
          success: true, 
          message: 'Power-ups initialized',
          powerUps: initializedPowerUps 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "use" or "initialize"' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Power-up API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      )
    }

    const powerUps = await getPlayerPowerUps(playerId)
    return NextResponse.json({ powerUps })
  } catch (error) {
    console.error('Get power-ups API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}