'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Share2, Copy, ExternalLink, Trophy } from 'lucide-react'

interface ReplayCreatorProps {
  sessionId: string
  onReplayCreated?: (replayCode: string) => void
}

interface ReplayResult {
  id: string
  replayCode: string
  title: string
  shareUrl: string
  socialUrls?: {
    twitter: string
    facebook: string
    linkedin: string
  }
}

export function ReplayCreator({ sessionId, onReplayCreated }: ReplayCreatorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [replay, setReplay] = useState<ReplayResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const createReplay = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/replay/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create replay')
      }

      setReplay(data.replay)
      setIsDialogOpen(true)
      onReplayCreated?.(data.replay.replayCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create replay')
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could show a toast notification here
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const shareToSocial = async (platform: string, url: string) => {
    if (replay) {
      // Record the share
      try {
        await fetch('/api/replay/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            replayId: replay.id,
            platform
          })
        })
      } catch (error) {
        console.error('Error recording share:', error)
      }
    }

    window.open(url, '_blank', 'width=600,height=400')
  }

  return (
    <>
      <Button
        onClick={createReplay}
        disabled={isCreating}
        className="w-full"
      >
        {isCreating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Creating Replay...
          </>
        ) : (
          <>
            <Trophy className="w-4 h-4 mr-2" />
            Create Shareable Replay
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Replay Created!
            </DialogTitle>
          </DialogHeader>
          
          {replay && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Your quiz replay is ready to share:
                </p>
                <p className="font-medium">{replay.title}</p>
              </div>

              {/* Share URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replay.shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(replay.shareUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Social Sharing */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share on Social Media</label>
                <div className="flex gap-2">
                  {replay.socialUrls && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareToSocial('twitter', replay.socialUrls!.twitter)}
                        className="flex-1"
                      >
                        Twitter
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareToSocial('facebook', replay.socialUrls!.facebook)}
                        className="flex-1"
                      >
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => shareToSocial('linkedin', replay.socialUrls!.linkedin)}
                        className="flex-1"
                      >
                        LinkedIn
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* View Replay */}
              <div className="pt-2">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => {
                    window.open(replay.shareUrl, '_blank')
                    setIsDialogOpen(false)
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Replay
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}