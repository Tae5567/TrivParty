'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, HelpText } from '@/components/ui/Tooltip'
import { Loader2, Globe, Youtube } from 'lucide-react'

interface URLInputFormProps {
  onSubmit: (url: string, source: 'wikipedia' | 'youtube') => void
  isLoading?: boolean
  error?: string | null
}

export function URLInputForm({ onSubmit, isLoading = false, error }: URLInputFormProps) {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const detectSourceType = (url: string): 'wikipedia' | 'youtube' | null => {
    const trimmedUrl = url.trim()
    
    // Wikipedia URL patterns
    if (trimmedUrl.includes('wikipedia.org')) {
      return 'wikipedia'
    }
    
    // YouTube URL patterns
    if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
      return 'youtube'
    }
    
    return null
  }

  const validateUrl = (url: string): string | null => {
    const trimmedUrl = url.trim()
    
    if (!trimmedUrl) {
      return 'Please enter a URL'
    }

    // Basic URL format validation
    try {
      new URL(trimmedUrl)
    } catch {
      return 'Please enter a valid URL'
    }

    const sourceType = detectSourceType(trimmedUrl)
    if (!sourceType) {
      return 'Please enter a Wikipedia or YouTube URL'
    }

    // Wikipedia specific validation
    if (sourceType === 'wikipedia') {
      if (!trimmedUrl.match(/https?:\/\/[a-z]{2,3}\.wikipedia\.org\/wiki\/.+/)) {
        return 'Please enter a valid Wikipedia article URL'
      }
    }

    // YouTube specific validation
    if (sourceType === 'youtube') {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      if (!youtubeRegex.test(trimmedUrl)) {
        return 'Please enter a valid YouTube video URL'
      }
    }

    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const error = validateUrl(url)
    if (error) {
      setValidationError(error)
      return
    }

    const sourceType = detectSourceType(url)
    if (sourceType) {
      setValidationError(null)
      onSubmit(url.trim(), sourceType)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }
  }

  const sourceType = url ? detectSourceType(url) : null
  const displayError = validationError || error

  return (
    <div className="w-full max-w-2xl mx-auto glass-card p-8">
      <div className="mb-6">
        <h3 className="flex items-center gap-3 text-2xl font-bold text-white mb-3">
          <Globe className="w-6 h-6" />
          Create Quiz from Content
          <HelpText text="Our AI will extract content from Wikipedia articles or YouTube videos and generate engaging multiple-choice questions automatically." />
        </h3>
        <p className="text-white/80 text-lg">
          Enter a Wikipedia article or YouTube video URL to generate trivia questions
        </p>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="url"
                placeholder="Paste Wikipedia or YouTube URL here..."
                value={url}
                onChange={handleUrlChange}
                disabled={isLoading}
                className={`w-full px-4 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all ${displayError ? 'border-red-400' : ''}`}
                aria-invalid={!!displayError}
                data-onboarding="url-input"
              />
              {sourceType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {sourceType === 'wikipedia' ? (
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  ) : (
                    <Youtube className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {displayError && (
              <p className="text-red-300 text-sm mt-2" role="alert">
                {displayError}
              </p>
            )}
            
            {sourceType && !displayError && (
              <p className="text-white/70 text-sm mt-2">
                {sourceType === 'wikipedia' 
                  ? '📖 Wikipedia article detected' 
                  : '🎥 YouTube video detected'
                }
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !url.trim()}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed backdrop-blur-sm border border-white/30 px-6 py-4 rounded-xl text-white font-semibold text-lg transition-all duration-300 hover:transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            data-onboarding="generate-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Quiz...</span>
              </>
            ) : (
              <span>Generate Quiz</span>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <h4 className="text-white/70 font-medium">Supported Sources:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 text-white/80">
              <Globe className="w-5 h-5 text-blue-300" />
              <span>Wikipedia articles</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Youtube className="w-5 h-5 text-red-300" />
              <span>YouTube videos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}