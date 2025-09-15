'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Play, Copy, Crown, User, Loader2 } from 'lucide-react'
import type { Player, Session, Quiz } from '@/types'

interface SessionLobbyProps {
  session: Session
  quiz: Quiz
  players: Player[]
  isHost: boolean
  hostId?: string
  currentPlayer?: Player
  onStartGame?: () => void
  onRefreshPlayers?: () => void
}

export function SessionLobby({ 
  session, 
  quiz, 
  players, 
  isHost, 
  hostId,
  currentPlayer,
  onStartGame,
  onRefreshPlayers 
}: SessionLobbyProps) {
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/play/${session.id}`

  const copyJoinLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = joinUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStartGame = async () => {
    if (!isHost || !hostId || !onStartGame) return

    setIsStarting(true)
    try {
      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          hostId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start game')
      }

      onStartGame()
    } catch (error) {
      console.error('Failed to start game:', error)
      alert(error instanceof Error ? error.message : 'Failed to start game')
    } finally {
      setIsStarting(false)
    }
  }

  // Auto-refresh players every 3 seconds
  useEffect(() => {
    if (!onRefreshPlayers) return

    const interval = setInterval(() => {
      onRefreshPlayers()
    }, 3000)

    return () => clearInterval(interval)
  }, [onRefreshPlayers])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Session Info */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{quiz.title}</span>
          </CardTitle>
          <CardDescription className="text-sm">
            {isHost ? 'You are hosting this session' : 'Waiting for the host to start the game'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Join Code</label>
              <div className="flex gap-2">
                <Input 
                  value={session.joinCode} 
                  readOnly 
                  className="font-mono text-base sm:text-lg text-center"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={copyJoinLink}
                  title="Copy join link"
                  className="shrink-0"
                >
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Questions</label>
              <Input 
                value={`${quiz.questions.length} questions`} 
                readOnly 
                className="text-center text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Share Link</label>
            <div className="flex gap-2">
              <Input 
                value={joinUrl} 
                readOnly 
                className="text-xs sm:text-sm"
              />
              <Button 
                variant="outline" 
                onClick={copyJoinLink}
                className="shrink-0 text-xs sm:text-sm"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                Players ({players.length})
              </CardTitle>
              <CardDescription className="text-sm">
                {players.length === 0 
                  ? 'No players have joined yet' 
                  : 'Players in this session'
                }
              </CardDescription>
            </div>
            {onRefreshPlayers && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRefreshPlayers}
                className="text-xs sm:text-sm"
              >
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Waiting for players to join...</p>
              <p className="text-xs sm:text-sm mt-2">Share the join code or link above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player) => (
                <div 
                  key={player.id} 
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isHost && player.id === currentPlayer?.id ? (
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                    ) : (
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-medium text-sm sm:text-base truncate">{player.nickname}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground shrink-0">
                    <span className="hidden sm:inline">Joined </span>
                    {new Date(player.joinedAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Host Controls */}
      {isHost && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              Host Controls
            </CardTitle>
            <CardDescription className="text-sm">
              Start the game when all players have joined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {players.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You need at least one player to start the game
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {players.length} player{players.length !== 1 ? 's' : ''} ready to play
                </p>
              )}
              
              <Button 
                onClick={handleStartGame}
                disabled={players.length === 0 || isStarting || !onStartGame}
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                    Starting Game...
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Waiting Message */}
      {!isHost && (
        <Card>
          <CardContent className="text-center py-6 sm:py-8">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-sm sm:text-base">
              Waiting for the host to start the game...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}