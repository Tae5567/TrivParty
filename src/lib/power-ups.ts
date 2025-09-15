import { supabase } from './supabase'
import type { PowerUp, PlayerPowerUp, PowerUpUsage, PowerUpType } from '@/types'

/**
 * Get all available power-ups
 */
export async function getAllPowerUps(): Promise<PowerUp[]> {
  const { data, error } = await supabase
    .from('power_ups')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(`Failed to get power-ups: ${error.message}`)
  }

  return data.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    icon: p.icon,
    maxUsesPerGame: p.max_uses_per_game,
    createdAt: p.created_at
  }))
}

/**
 * Get power-ups for a specific player
 */
export async function getPlayerPowerUps(playerId: string): Promise<PlayerPowerUp[]> {
  const { data, error } = await supabase
    .from('player_power_ups')
    .select(`
      *,
      power_ups (*)
    `)
    .eq('player_id', playerId)

  if (error) {
    throw new Error(`Failed to get player power-ups: ${error.message}`)
  }

  return data.map(p => ({
    id: p.id,
    playerId: p.player_id,
    powerUpId: p.power_up_id,
    usesRemaining: p.uses_remaining,
    createdAt: p.created_at,
    powerUp: p.power_ups ? {
      id: p.power_ups.id,
      name: p.power_ups.name,
      description: p.power_ups.description,
      icon: p.power_ups.icon,
      maxUsesPerGame: p.power_ups.max_uses_per_game,
      createdAt: p.power_ups.created_at
    } : undefined
  }))
}

/**
 * Initialize power-ups for a player when they join a session
 */
export async function initializePlayerPowerUps(playerId: string): Promise<void> {
  // Get all available power-ups
  const powerUps = await getAllPowerUps()

  // Create player power-ups with default uses
  const playerPowerUps = powerUps.map(powerUp => ({
    player_id: playerId,
    power_up_id: powerUp.id,
    uses_remaining: powerUp.maxUsesPerGame
  }))

  const { error } = await supabase
    .from('player_power_ups')
    .insert(playerPowerUps)

  if (error) {
    throw new Error(`Failed to initialize player power-ups: ${error.message}`)
  }
}

/**
 * Use a power-up for a player on a specific question
 */
export async function usePowerUp(
  playerId: string,
  powerUpType: PowerUpType,
  questionId: string
): Promise<{ success: boolean; message: string }> {
  // Get the power-up by name
  const { data: powerUp, error: powerUpError } = await supabase
    .from('power_ups')
    .select('id')
    .eq('name', powerUpType)
    .single()

  if (powerUpError || !powerUp) {
    return { success: false, message: 'Power-up not found' }
  }

  // Check if player has uses remaining
  const { data: playerPowerUp, error: playerPowerUpError } = await supabase
    .from('player_power_ups')
    .select('uses_remaining')
    .eq('player_id', playerId)
    .eq('power_up_id', powerUp.id)
    .single()

  if (playerPowerUpError || !playerPowerUp) {
    return { success: false, message: 'Player does not have this power-up' }
  }

  if (playerPowerUp.uses_remaining <= 0) {
    return { success: false, message: 'No uses remaining for this power-up' }
  }

  // Check if power-up was already used on this question
  const { data: existingUsage } = await supabase
    .from('power_up_usage')
    .select('id')
    .eq('player_id', playerId)
    .eq('power_up_id', powerUp.id)
    .eq('question_id', questionId)
    .single()

  if (existingUsage) {
    return { success: false, message: 'Power-up already used on this question' }
  }

  // Record the usage
  const { error: usageError } = await supabase
    .from('power_up_usage')
    .insert({
      player_id: playerId,
      power_up_id: powerUp.id,
      question_id: questionId
    })

  if (usageError) {
    return { success: false, message: 'Failed to record power-up usage' }
  }

  // Decrease uses remaining
  const { error: updateError } = await supabase
    .from('player_power_ups')
    .update({ uses_remaining: playerPowerUp.uses_remaining - 1 })
    .eq('player_id', playerId)
    .eq('power_up_id', powerUp.id)

  if (updateError) {
    return { success: false, message: 'Failed to update power-up uses' }
  }

  return { success: true, message: 'Power-up used successfully' }
}

/**
 * Check if a power-up was used by a player on a specific question
 */
export async function wasPowerUpUsed(
  playerId: string,
  powerUpType: PowerUpType,
  questionId: string
): Promise<boolean> {
  const { data: powerUp } = await supabase
    .from('power_ups')
    .select('id')
    .eq('name', powerUpType)
    .single()

  if (!powerUp) return false

  const { data: usage } = await supabase
    .from('power_up_usage')
    .select('id')
    .eq('player_id', playerId)
    .eq('power_up_id', powerUp.id)
    .eq('question_id', questionId)
    .single()

  return !!usage
}

/**
 * Get power-up usage for a specific question (for all players)
 */
export async function getQuestionPowerUpUsage(questionId: string): Promise<PowerUpUsage[]> {
  const { data, error } = await supabase
    .from('power_up_usage')
    .select('*')
    .eq('question_id', questionId)

  if (error) {
    throw new Error(`Failed to get power-up usage: ${error.message}`)
  }

  return data.map(u => ({
    id: u.id,
    playerId: u.player_id,
    powerUpId: u.power_up_id,
    questionId: u.question_id,
    usedAt: u.used_at
  }))
}

/**
 * Reset all power-ups for players in a session (useful for replaying)
 */
export async function resetSessionPowerUps(sessionId: string): Promise<void> {
  // Get all players in the session
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('session_id', sessionId)

  if (playersError) {
    throw new Error(`Failed to get session players: ${playersError.message}`)
  }

  const playerIds = players.map(p => p.id)

  // Reset power-up uses to max for all players
  const { data: powerUps } = await supabase
    .from('power_ups')
    .select('id, max_uses_per_game')

  if (powerUps) {
    for (const powerUp of powerUps) {
      await supabase
        .from('player_power_ups')
        .update({ uses_remaining: powerUp.max_uses_per_game })
        .in('player_id', playerIds)
        .eq('power_up_id', powerUp.id)
    }
  }

  // Delete all power-up usage records for this session
  await supabase
    .from('power_up_usage')
    .delete()
    .in('player_id', playerIds)
}