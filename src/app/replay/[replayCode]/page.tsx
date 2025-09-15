'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { GameReplay } from '@/types/replay'
import { ReplayViewer } from '@/components/ReplayViewer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReplayPage() {
  const params = useParams()
  const replayCode = params.replayCode as string
  const [replay, setReplay] = useState<GameReplay | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!replayCode) return

    const fetchReplay = async () => {
      try {
        const response = await fetch(`/api/replay/${replayCode}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch replay')
        }

        setReplay(data.replay)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load replay')
      } finally {
        setLoading(false)
      }
    }

    fetchReplay()
  }, [replayCode])

  const handleShare = async (platform: string) => {
    if (!replay) return

    try {
      // Record the share
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

      // Generate share URLs
      const baseUrl = window.location.origin
      const shareUrl = `${baseUrl}/replay/${replayCode}`
      const title = `Check out my TrivParty quiz results: ${replay.title}`

      switch (platform) {
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
          break
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
          break
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
          break
        case 'copy_link':
          await navigator.clipboard.writeText(shareUrl)
          // You could show a toast notification here
          alert('Link copied to clipboard!')
          break
      }
    } catch (error) {
      console.error('Error sharing replay:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading replay...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !replay) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Replay Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || 'This replay may have expired or does not exist.'}
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleShare('copy_link')}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="text-blue-500 hover:text-blue-600"
            >
              Twitter
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="text-blue-600 hover:text-blue-700"
            >
              Facebook
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleShare('linkedin')}
              className="text-blue-700 hover:text-blue-800"
            >
              LinkedIn
            </Button>
          </div>
        </div>
      </div>

      {/* Replay Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{replay.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {replay.viewCount} views
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Quiz</p>
              <p className="font-medium">{replay.quizTitle}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Questions</p>
              <p className="font-medium">{replay.totalQuestions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Players</p>
              <p className="font-medium">{replay.totalPlayers}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">
                {replay.sessionDurationSeconds 
                  ? `${Math.floor(replay.sessionDurationSeconds / 60)}:${(replay.sessionDurationSeconds % 60).toString().padStart(2, '0')}`
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Replay Viewer */}
      <ReplayViewer replay={replay} />
    </div>
  )
}