'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Copy, Users, Play } from 'lucide-react'
import type { Quiz, SessionCreationResponse } from '@/types'

interface SessionCreatorProps {
  quiz: Quiz
  onSessionCreated: (sessionData: SessionCreationResponse & { quiz: Quiz }) => void
}

export function SessionCreator({ quiz, onSessionCreated }: SessionCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [session, setSession] = useState<SessionCreationResponse | null>(null)
  const [hostId] = useState(() => crypto.randomUUID()) // Generate host ID
  const [copied, setCopied] = useState(false)

  const createSession = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          hostId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create session')
      }

      const sessionData = await response.json() as SessionCreationResponse
      setSession(sessionData)
      onSessionCreated({ ...sessionData, quiz })
    } catch (error) {
      console.error('Failed to create session:', error)
      alert(error instanceof Error ? error.message : 'Failed to create session')
    } finally {
      setIsCreating(false)
    }
  }

  const copyJoinLink = async () => {
    if (!session) return
    
    const joinUrl = `${window.location.origin}/play/${session.sessionId}`
    
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

  if (session) {
    const joinUrl = `${window.location.origin}/play/${session.sessionId}`
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Session Created
          </CardTitle>
          <CardDescription>
            Share this link with players to join your quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Join Code</label>
            <div className="flex gap-2">
              <Input 
                value={session.joinCode} 
                readOnly 
                className="font-mono text-lg text-center"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyJoinLink}
                title="Copy join link"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Join Link</label>
            <div className="flex gap-2">
              <Input 
                value={joinUrl} 
                readOnly 
                className="text-sm"
              />
              <Button 
                variant="outline" 
                onClick={copyJoinLink}
                className="shrink-0"
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-4">
              Players can join using the code <strong>{session.joinCode}</strong> or by visiting the link above.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Create Game Session
        </CardTitle>
        <CardDescription>
          Create a multiplayer session for "{quiz.title}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Quiz Details</h4>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Title:</strong> {quiz.title}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Questions:</strong> {quiz.questions.length}
            </p>
          </div>
          
          <Button 
            onClick={createSession} 
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? 'Creating Session...' : 'Create Session'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}