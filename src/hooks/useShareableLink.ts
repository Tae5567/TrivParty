'use client'

import { useState, useCallback } from 'react'

interface UseShareableLinkOptions {
  baseUrl?: string
}

export function useShareableLink(options: UseShareableLinkOptions = {}) {
  const [copied, setCopied] = useState(false)

  const generateJoinLink = useCallback((sessionId: string): string => {
    const baseUrl = options.baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${baseUrl}/play/${sessionId}`
  }, [options.baseUrl])

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for browsers that don't support clipboard API or non-HTTPS
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }, [])

  const copyJoinLink = useCallback(async (sessionId: string): Promise<boolean> => {
    const link = generateJoinLink(sessionId)
    return copyToClipboard(link)
  }, [generateJoinLink, copyToClipboard])

  const shareJoinLink = useCallback(async (sessionId: string, title?: string): Promise<boolean> => {
    const link = generateJoinLink(sessionId)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'Join my trivia quiz!',
          text: 'Join my trivia quiz game',
          url: link,
        })
        return true
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        console.log('Share cancelled or failed, falling back to copy')
      }
    }
    
    // Fallback to copying
    return copyToClipboard(link)
  }, [generateJoinLink, copyToClipboard])

  return {
    copied,
    generateJoinLink,
    copyToClipboard,
    copyJoinLink,
    shareJoinLink,
  }
}