import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReplayCreator } from '../ReplayCreator'

// Mock fetch
global.fetch = vi.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})

// Mock window.open
global.open = vi.fn()

// Mock alert
global.alert = vi.fn()

describe('ReplayCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render create replay button', () => {
    render(<ReplayCreator sessionId="session-123" />)
    
    expect(screen.getByText('Create Shareable Replay')).toBeInTheDocument()
  })

  it('should show loading state when creating replay', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    expect(screen.getByText('Creating Replay...')).toBeInTheDocument()
    expect(createButton).toBeDisabled()
  })

  it('should create replay successfully and show dialog', async () => {
    const mockReplay = {
      id: 'replay-123',
      replayCode: 'ABC12345',
      title: 'Test Quiz Replay',
      shareUrl: 'https://example.com/replay/ABC12345',
      socialUrls: {
        twitter: 'https://twitter.com/intent/tweet?...',
        facebook: 'https://facebook.com/sharer/...',
        linkedin: 'https://linkedin.com/sharing/...'
      }
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, replay: mockReplay })
    } as Response)

    const onReplayCreated = vi.fn()
    render(<ReplayCreator sessionId="session-123" onReplayCreated={onReplayCreated} />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Replay Created!')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Test Quiz Replay')).toBeInTheDocument()
    expect(screen.getByDisplayValue('https://example.com/replay/ABC12345')).toBeInTheDocument()
    expect(onReplayCreated).toHaveBeenCalledWith('ABC12345')
  })

  it('should handle replay creation error', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to create replay' })
    } as Response)

    render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create replay')).toBeInTheDocument()
    })
  })

  it('should copy share link to clipboard', async () => {
    const mockReplay = {
      id: 'replay-123',
      replayCode: 'ABC12345',
      title: 'Test Quiz Replay',
      shareUrl: 'https://example.com/replay/ABC12345'
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, replay: mockReplay })
    } as Response)

    render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Replay Created!')).toBeInTheDocument()
    })
    
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/replay/ABC12345')
    expect(alert).toHaveBeenCalledWith('Link copied to clipboard!')
  })

  it('should open social media share windows', async () => {
    const mockReplay = {
      id: 'replay-123',
      replayCode: 'ABC12345',
      title: 'Test Quiz Replay',
      shareUrl: 'https://example.com/replay/ABC12345',
      socialUrls: {
        twitter: 'https://twitter.com/intent/tweet?text=Check%20out%20my%20TrivParty%20quiz%20results%3A%20Test%20Quiz%20Replay&url=https%3A%2F%2Fexample.com%2Freplay%2FABC12345',
        facebook: 'https://facebook.com/sharer/sharer.php?u=https%3A%2F%2Fexample.com%2Freplay%2FABC12345',
        linkedin: 'https://linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fexample.com%2Freplay%2FABC12345'
      }
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, replay: mockReplay })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      } as Response)

    render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Replay Created!')).toBeInTheDocument()
    })
    
    const twitterButton = screen.getByText('Twitter')
    fireEvent.click(twitterButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/replay/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replayId: 'replay-123',
          platform: 'twitter'
        })
      })
    })
    
    expect(window.open).toHaveBeenCalledWith(
      mockReplay.socialUrls.twitter,
      '_blank',
      'width=600,height=400'
    )
  })

  it('should open replay in new window', async () => {
    const mockReplay = {
      id: 'replay-123',
      replayCode: 'ABC12345',
      title: 'Test Quiz Replay',
      shareUrl: 'https://example.com/replay/ABC12345'
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, replay: mockReplay })
    } as Response)

    render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Replay Created!')).toBeInTheDocument()
    })
    
    const viewReplayButton = screen.getByText('View Replay')
    fireEvent.click(viewReplayButton)
    
    expect(window.open).toHaveBeenCalledWith('https://example.com/replay/ABC12345', '_blank')
  })

  it('should handle network errors gracefully', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})