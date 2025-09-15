import { createClientComponentClient } from '@/lib/supabase'
import type { Player } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface PlayerPresence {
  playerId: string
  nickname: string
  joinedAt: string
  lastSeen: string
  isOnline: boolean
}

export class PlayerSync {
  private supabase = createClientComponentClient()
  private sessionId: string
  private playerId: string | null = null
  private channel: RealtimeChannel | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private onlinePlayersCache: Map<string, PlayerPresence> = new Map()

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  // Initialize player synchronization
  async initialize(playerId: string, nickname: string): Promise<void> {
    this.playerId = playerId
    
    this.channel = this.supabase.channel(`players:${this.sessionId}`, {
      config: {
        presence: { key: playerId },
        broadcast: { self: false },
      },
    })

    // Track player presence
    await this.channel
      .on('presence', { event: 'sync' }, () => {
        this.syncPlayerPresence()
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        this.handlePlayerJoin(key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        this.handlePlayerLeave(key, leftPresences)
      })
      .on('broadcast', { event: 'player_disconnected' }, (payload) => {
        this.handlePlayerDisconnection(payload.payload)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this player's presence
          await this.trackPresence(playerId, nickname)
          this.startHeartbeat()
        }
      })
  }

  // Track player presence in the channel
  private async trackPresence(playerId: string, nickname: string): Promise<void> {
    if (!this.channel) return

    const presenceData: PlayerPresence = {
      playerId,
      nickname,
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      isOnline: true,
    }

    await this.channel.track(presenceData)
  }

  // Start heartbeat to maintain presence
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.channel && this.playerId) {
        const currentPresence = this.onlinePlayersCache.get(this.playerId)
        if (currentPresence) {
          await this.channel.track({
            ...currentPresence,
            lastSeen: new Date().toISOString(),
          })
        }
      }
    }, 30000) // Update every 30 seconds
  }

  // Sync player presence state
  private syncPlayerPresence(): void {
    if (!this.channel) return

    const presenceState = this.channel.presenceState()
    this.onlinePlayersCache.clear()

    Object.entries(presenceState).forEach(([playerId, presences]) => {
      if (presences.length > 0) {
        const latestPresence = presences[0] as PlayerPresence
        this.onlinePlayersCache.set(playerId, {
          ...latestPresence,
          isOnline: true,
        })
      }
    })

    this.notifyPresenceChange()
  }

  // Handle player joining
  private handlePlayerJoin(playerId: string, newPresences: any[]): void {
    if (newPresences.length > 0) {
      const presence = newPresences[0] as PlayerPresence
      this.onlinePlayersCache.set(playerId, {
        ...presence,
        isOnline: true,
      })
      this.notifyPlayerJoined(presence)
    }
  }

  // Handle player leaving
  private handlePlayerLeave(playerId: string, leftPresences: any[]): void {
    if (leftPresences.length > 0) {
      const presence = leftPresences[0] as PlayerPresence
      this.onlinePlayersCache.delete(playerId)
      this.notifyPlayerLeft(presence)
    }
  }

  // Handle player disconnection
  private handlePlayerDisconnection(data: { playerId: string; reason?: string }): void {
    const presence = this.onlinePlayersCache.get(data.playerId)
    if (presence) {
      const updatedPresence = {
        ...presence,
        isOnline: false,
      }
      this.onlinePlayersCache.set(data.playerId, updatedPresence)
      this.notifyPlayerDisconnected(updatedPresence, data.reason)
    }
  }

  // Get all online players
  getOnlinePlayers(): PlayerPresence[] {
    return Array.from(this.onlinePlayersCache.values()).filter(p => p.isOnline)
  }

  // Get specific player presence
  getPlayerPresence(playerId: string): PlayerPresence | null {
    return this.onlinePlayersCache.get(playerId) || null
  }

  // Check if player is online
  isPlayerOnline(playerId: string): boolean {
    const presence = this.onlinePlayersCache.get(playerId)
    return presence?.isOnline || false
  }

  // Broadcast player disconnection
  async broadcastDisconnection(reason?: string): Promise<void> {
    if (!this.channel || !this.playerId) return

    await this.channel.send({
      type: 'broadcast',
      event: 'player_disconnected',
      payload: {
        playerId: this.playerId,
        reason,
        timestamp: new Date().toISOString(),
      },
    })
  }

  // Get players from database with online status
  async getPlayersWithStatus(): Promise<(Player & { isOnline: boolean })[]> {
    const { data: players, error } = await this.supabase
      .from('players')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('score', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch players: ${error.message}`)
    }

    return (players || []).map(player => ({
      ...player,
      isOnline: this.isPlayerOnline(player.id),
    }))
  }

  // Remove player from session (database)
  async removePlayer(playerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('players')
      .delete()
      .eq('id', playerId)

    if (error) {
      throw new Error(`Failed to remove player: ${error.message}`)
    }
  }

  // Event callbacks
  private presenceChangeCallbacks: ((players: PlayerPresence[]) => void)[] = []
  private playerJoinedCallbacks: ((player: PlayerPresence) => void)[] = []
  private playerLeftCallbacks: ((player: PlayerPresence) => void)[] = []
  private playerDisconnectedCallbacks: ((player: PlayerPresence, reason?: string) => void)[] = []

  // Subscribe to presence changes
  onPresenceChange(callback: (players: PlayerPresence[]) => void): void {
    this.presenceChangeCallbacks.push(callback)
  }

  // Subscribe to player joined events
  onPlayerJoined(callback: (player: PlayerPresence) => void): void {
    this.playerJoinedCallbacks.push(callback)
  }

  // Subscribe to player left events
  onPlayerLeft(callback: (player: PlayerPresence) => void): void {
    this.playerLeftCallbacks.push(callback)
  }

  // Subscribe to player disconnected events
  onPlayerDisconnected(callback: (player: PlayerPresence, reason?: string) => void): void {
    this.playerDisconnectedCallbacks.push(callback)
  }

  // Notify presence change
  private notifyPresenceChange(): void {
    const onlinePlayers = this.getOnlinePlayers()
    this.presenceChangeCallbacks.forEach(callback => callback(onlinePlayers))
  }

  // Notify player joined
  private notifyPlayerJoined(player: PlayerPresence): void {
    this.playerJoinedCallbacks.forEach(callback => callback(player))
  }

  // Notify player left
  private notifyPlayerLeft(player: PlayerPresence): void {
    this.playerLeftCallbacks.forEach(callback => callback(player))
  }

  // Notify player disconnected
  private notifyPlayerDisconnected(player: PlayerPresence, reason?: string): void {
    this.playerDisconnectedCallbacks.forEach(callback => callback(player, reason))
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }

    this.onlinePlayersCache.clear()
    this.presenceChangeCallbacks.length = 0
    this.playerJoinedCallbacks.length = 0
    this.playerLeftCallbacks.length = 0
    this.playerDisconnectedCallbacks.length = 0
  }
}