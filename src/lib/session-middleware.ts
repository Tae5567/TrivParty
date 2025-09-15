import { NextRequest } from 'next/server'
import { getSessionById, getPlayersBySessionId } from '@/lib/database'
import type { Session, Player } from '@/types'

export interface SessionValidationResult {
  success: boolean
  session?: Session
  players?: Player[]
  error?: string
  statusCode?: number
}

export interface AuthorizationContext {
  session: Session
  players: Player[]
  hostId?: string
  playerId?: string
}

/**
 * Validates that a session exists and is in a valid state
 */
export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
  try {
    const session = await getSessionById(sessionId)
    
    if (!session) {
      return {
        success: false,
        error: 'Session not found',
        statusCode: 404
      }
    }

    const players = await getPlayersBySessionId(sessionId)

    return {
      success: true,
      session,
      players
    }
  } catch (error) {
    console.error('Session validation error:', error)
    return {
      success: false,
      error: 'Failed to validate session',
      statusCode: 500
    }
  }
}

/**
 * Validates that the requesting user is the host of the session
 */
export function validateHostAuthorization(
  context: AuthorizationContext,
  requestHostId: string
): { authorized: boolean; error?: string; statusCode?: number } {
  if (context.session.hostId !== requestHostId) {
    return {
      authorized: false,
      error: 'Unauthorized: Only the host can perform this action',
      statusCode: 403
    }
  }

  return { authorized: true }
}

/**
 * Validates that the requesting user is a player in the session
 */
export function validatePlayerAuthorization(
  context: AuthorizationContext,
  requestPlayerId: string
): { authorized: boolean; player?: Player; error?: string; statusCode?: number } {
  const player = context.players.find(p => p.id === requestPlayerId)
  
  if (!player) {
    return {
      authorized: false,
      error: 'Unauthorized: Player not found in session',
      statusCode: 403
    }
  }

  return { authorized: true, player }
}

/**
 * Validates that the session is in the expected status
 */
export function validateSessionStatus(
  session: Session,
  expectedStatus: Session['status'] | Session['status'][]
): { valid: boolean; error?: string; statusCode?: number } {
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus]
  
  if (!expectedStatuses.includes(session.status)) {
    return {
      valid: false,
      error: `Session must be in ${expectedStatuses.join(' or ')} status`,
      statusCode: 400
    }
  }

  return { valid: true }
}

/**
 * Extracts authorization headers from request
 */
export function extractAuthHeaders(request: NextRequest): {
  hostId?: string
  playerId?: string
  playerToken?: string
} {
  const hostId = request.headers.get('x-host-id') || undefined
  const playerId = request.headers.get('x-player-id') || undefined
  const playerToken = request.headers.get('x-player-token') || undefined

  return { hostId, playerId, playerToken }
}

/**
 * Comprehensive session and authorization validation
 */
export async function validateSessionAndAuth(
  sessionId: string,
  options: {
    requireHost?: boolean
    requirePlayer?: boolean
    hostId?: string
    playerId?: string
    expectedStatus?: Session['status'] | Session['status'][]
  }
): Promise<{
  success: boolean
  context?: AuthorizationContext
  player?: Player
  error?: string
  statusCode?: number
}> {
  // First validate the session exists
  const sessionValidation = await validateSession(sessionId)
  if (!sessionValidation.success) {
    return sessionValidation
  }

  const context: AuthorizationContext = {
    session: sessionValidation.session!,
    players: sessionValidation.players!
  }

  // Validate session status if required
  if (options.expectedStatus) {
    const statusValidation = validateSessionStatus(context.session, options.expectedStatus)
    if (!statusValidation.valid) {
      return {
        success: false,
        error: statusValidation.error,
        statusCode: statusValidation.statusCode
      }
    }
  }

  // Validate host authorization if required
  if (options.requireHost && options.hostId) {
    const hostAuth = validateHostAuthorization(context, options.hostId)
    if (!hostAuth.authorized) {
      return {
        success: false,
        error: hostAuth.error,
        statusCode: hostAuth.statusCode
      }
    }
  }

  // Validate player authorization if required
  let player: Player | undefined
  if (options.requirePlayer && options.playerId) {
    const playerAuth = validatePlayerAuthorization(context, options.playerId)
    if (!playerAuth.authorized) {
      return {
        success: false,
        error: playerAuth.error,
        statusCode: playerAuth.statusCode
      }
    }
    player = playerAuth.player
  }

  return {
    success: true,
    context,
    player
  }
}