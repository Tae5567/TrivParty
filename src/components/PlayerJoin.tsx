'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { UserPlus, Loader2 } from 'lucide-react'
import type { PlayerJoinResponse } from '@/types'

interface PlayerJoinProps {
  sessionId?: string
  joinCode?: string
  onPlayerJoined: (playerData: PlayerJoinResponse & { nickname: string; sessionId: string }) => void
}

export function PlayerJoin({ sessionId, joinCode, onPlayerJoined }: PlayerJoinProps) {
  const [nickname, setNickname] = useState('')
  const [inputJoinCode, setInputJoinCode] = useState(joinCode || '')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateNickname = (name: string): string | null => {
    if (!name.trim()) {
      return 'Nickname is required'
    }
    if (name.length > 20) {
      return 'Nickname must be 20 characters or less'
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      return 'Nickname can only contain letters, numbers, and spaces'
    }
    return null
  }

  const joinSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate nickname
    const nicknameError = validateNickname(nickname)
    if (nicknameError) {
      setError(nicknameError)
      return
    }

    // Ensure we have either sessionId or joinCode
    if (!sessionId && !inputJoinCode.trim()) {
      setError('Please enter a join code')
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch('/api/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          joinCode: inputJoinCode.trim().toUpperCase() || undefined,
          nickname: nickname.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join session')
      }

      const playerData = await response.json() as PlayerJoinResponse & { 
        nickname: string; 
        sessionId: string 
      }
      
      onPlayerJoined(playerData)
    } catch (error) {
      console.error('Failed to join session:', error)
      setError(error instanceof Error ? error.message : 'Failed to join session')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto glass-card p-8">
      <div className="mb-6">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-white mb-3">
          <UserPlus className="h-6 w-6" />
          Join Quiz Session
        </h3>
        <p className="text-white/80">
          Enter your nickname to join the trivia game
        </p>
      </div>
      <div>
        <form onSubmit={joinSession} className="space-y-4">
          {!sessionId && (
            <div>
              <label htmlFor="joinCode" className="text-white font-medium mb-3 block">
                Join Code
              </label>
              <input
                id="joinCode"
                type="text"
                placeholder="Enter 6-character code"
                value={inputJoinCode}
                onChange={(e) => setInputJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 text-lg font-mono text-center focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
                required={!sessionId}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="nickname" className="text-white font-medium mb-3 block">
              Your Nickname
            </label>
            <input
              id="nickname"
              type="text"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all"
              required
            />
            <p className="text-white/60 text-sm mt-2">
              Max 20 characters, letters and numbers only
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isJoining || !nickname.trim() || (!sessionId && !inputJoinCode.trim())}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-sm border border-white/30 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:transform hover:scale-[1.02] flex items-center justify-center space-x-2"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <span>Join Game</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}