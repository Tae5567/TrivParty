import { NextRequest, NextResponse } from 'next/server'
import { getSessionByJoinCode, getSessionById, createPlayer, getPlayersBySessionId } from '@/lib/database'
import { initializePlayerPowerUps } from '@/lib/power-ups'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const joinSessionSchema = z.object({
  sessionId: z.string().optional(),
  joinCode: z.string().optional(),
  nickname: z.string()
    .min(1, 'Nickname is required')
    .max(20, 'Nickname must be 20 characters or less')
    .regex(/^[a-zA-Z0-9\s]+$/, 'Nickname can only contain letters, numbers, and spaces')
}).refine(
  (data) => data.sessionId || data.joinCode,
  {
    message: 'Either sessionId or joinCode must be provided',
    path: ['sessionId']
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = joinSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { sessionId, joinCode, nickname } = validation.data

    // Check if user is authenticated (optional)
    let userId: string | null = null
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          userId = user.id
        }
      } catch (error) {
        // Authentication is optional for joining
        console.log('Optional auth failed:', error)
      }
    }

    // Find session by ID or join code
    let session
    if (joinCode) {
      session = await getSessionByJoinCode(joinCode)
    } else if (sessionId) {
      session = await getSessionById(sessionId)
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session is still accepting players
    if (session.status !== 'waiting') {
      return NextResponse.json(
        { error: 'Session is no longer accepting players' },
        { status: 400 }
      )
    }

    // Check if nickname is already taken in this session
    const existingPlayers = await getPlayersBySessionId(session.id)
    const nicknameExists = existingPlayers.some(
      player => player.nickname.toLowerCase() === nickname.toLowerCase()
    )

    if (nicknameExists) {
      return NextResponse.json(
        { error: 'Nickname is already taken in this session' },
        { status: 409 }
      )
    }

    // Create player with optional user ID
    const player = await createPlayer(session.id, nickname, userId)

    // Initialize power-ups for the new player
    try {
      await initializePlayerPowerUps(player.id)
    } catch (powerUpError) {
      console.error('Failed to initialize power-ups for player:', powerUpError)
      // Don't fail the join if power-up initialization fails
    }

    // Generate a simple player token (in production, use proper JWT)
    const playerToken = randomUUID()

    return NextResponse.json({
      playerId: player.id,
      playerToken,
      sessionId: session.id,
      nickname: player.nickname
    })

  } catch (error) {
    console.error('Player join error:', error)
    return NextResponse.json(
      { error: 'Failed to join session' },
      { status: 500 }
    )
  }
}