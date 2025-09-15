'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { RealtimeConnectionManager } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeContextType {
  connectionManager: RealtimeConnectionManager
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  subscribeToSession: (sessionId: string, callbacks: SessionCallbacks) => void
  unsubscribeFromSession: (sessionId: string) => void
  isConnected: boolean
}

interface SessionCallbacks {
  onPlayerJoined?: (player: any) => void
  onPlayerLeft?: (playerId: string) => void
  onGameStateChanged?: (gameState: any) => void
  onQuestionChanged?: (question: any) => void
  onAnswerSubmitted?: (answer: any) => void
  onScoreUpdated?: (scores: any) => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const connectionManagerRef = useRef<RealtimeConnectionManager>()
  const activeSessionsRef = useRef<Set<string>>(new Set())

  // Initialize connection manager
  useEffect(() => {
    connectionManagerRef.current = new RealtimeConnectionManager()
    setConnectionStatus('connecting')

    // Monitor connection status
    const checkConnection = () => {
      if (connectionManagerRef.current) {
        const status = connectionManagerRef.current.getConnectionStatus()
        switch (status) {
          case '1': // OPEN
            setConnectionStatus('connected')
            break
          case '0': // CONNECTING
            setConnectionStatus('connecting')
            break
          case '2': // CLOSING
          case '3': // CLOSED
            setConnectionStatus('disconnected')
            break
          default:
            setConnectionStatus('error')
        }
      }
    }

    const interval = setInterval(checkConnection, 1000)
    checkConnection() // Initial check

    return () => {
      clearInterval(interval)
      if (connectionManagerRef.current) {
        connectionManagerRef.current.cleanup()
      }
    }
  }, [])

  const subscribeToSession = (sessionId: string, callbacks: SessionCallbacks) => {
    if (!connectionManagerRef.current) return

    const channelName = `session:${sessionId}`
    activeSessionsRef.current.add(sessionId)

    const channel = connectionManagerRef.current.subscribeToChannel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: sessionId },
      },
    })

    // Subscribe to database changes for the session
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        callbacks.onPlayerJoined?.(payload.new)
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        callbacks.onPlayerLeft?.(payload.old.id)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        callbacks.onGameStateChanged?.(payload.new)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'players',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        callbacks.onScoreUpdated?.(payload.new)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'player_answers',
      }, (payload) => {
        callbacks.onAnswerSubmitted?.(payload.new)
      })

    // Subscribe to broadcast events for real-time game events
    channel
      .on('broadcast', { event: 'question_changed' }, (payload) => {
        callbacks.onQuestionChanged?.(payload.payload)
      })
      .on('broadcast', { event: 'game_state_sync' }, (payload) => {
        callbacks.onGameStateChanged?.(payload.payload)
      })

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to session ${sessionId}`)
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to session ${sessionId}`)
        setConnectionStatus('error')
      }
    })
  }

  const unsubscribeFromSession = (sessionId: string) => {
    if (!connectionManagerRef.current) return

    const channelName = `session:${sessionId}`
    connectionManagerRef.current.unsubscribeFromChannel(channelName)
    activeSessionsRef.current.delete(sessionId)
  }

  const contextValue: RealtimeContextType = {
    connectionManager: connectionManagerRef.current!,
    connectionStatus,
    subscribeToSession,
    unsubscribeFromSession,
    isConnected: connectionStatus === 'connected',
  }

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Hook for session-specific real-time functionality
export function useSessionRealtime(sessionId: string | null, callbacks: SessionCallbacks) {
  const { subscribeToSession, unsubscribeFromSession, isConnected } = useRealtime()

  useEffect(() => {
    if (!sessionId || !isConnected) return

    subscribeToSession(sessionId, callbacks)

    return () => {
      unsubscribeFromSession(sessionId)
    }
  }, [sessionId, isConnected, subscribeToSession, unsubscribeFromSession])

  return { isConnected }
}