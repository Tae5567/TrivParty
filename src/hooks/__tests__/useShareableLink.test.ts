import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useShareableLink } from '../useShareableLink'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  share: vi.fn(() => Promise.resolve()),
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
})

// Mock document methods for fallback
const mockTextArea = {
  value: '',
  style: {},
  focus: vi.fn(),
  select: vi.fn(),
}

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => mockTextArea),
})

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
})

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
})

Object.defineProperty(document, 'execCommand', {
  value: vi.fn(),
})

describe('useShareableLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates join link with default base URL', () => {
    const { result } = renderHook(() => useShareableLink())
    
    const link = result.current.generateJoinLink('session-123')
    expect(link).toBe('http://localhost:3000/play/session-123')
  })

  it('generates join link with custom base URL', () => {
    const { result } = renderHook(() => 
      useShareableLink({ baseUrl: 'https://example.com' })
    )
    
    const link = result.current.generateJoinLink('session-123')
    expect(link).toBe('https://example.com/play/session-123')
  })

  it('copies text to clipboard successfully', async () => {
    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = false
    await act(async () => {
      success = await result.current.copyToClipboard('test text')
    })

    expect(success).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text')
    expect(result.current.copied).toBe(true)
  })

  it('sets copied state to false after timeout', async () => {
    vi.useFakeTimers()
    
    const { result } = renderHook(() => useShareableLink())
    
    await act(async () => {
      await result.current.copyToClipboard('test text')
    })

    expect(result.current.copied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.copied).toBe(false)
    
    vi.useRealTimers()
  })

  it('falls back to execCommand when clipboard API fails', async () => {
    ;(navigator.clipboard.writeText as any).mockRejectedValueOnce(
      new Error('Clipboard failed')
    )

    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = false
    await act(async () => {
      success = await result.current.copyToClipboard('test text')
    })

    expect(success).toBe(true)
    expect(document.createElement).toHaveBeenCalledWith('textarea')
    expect(mockTextArea.value).toBe('test text')
    expect(document.execCommand).toHaveBeenCalledWith('copy')
  })

  it('returns false when copying fails', async () => {
    ;(navigator.clipboard.writeText as any).mockRejectedValueOnce(
      new Error('Clipboard failed')
    )
    ;(document.execCommand as any).mockReturnValueOnce(false)

    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = true
    await act(async () => {
      success = await result.current.copyToClipboard('test text')
    })

    expect(success).toBe(false)
  })

  it('copies join link successfully', async () => {
    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = false
    await act(async () => {
      success = await result.current.copyJoinLink('session-123')
    })

    expect(success).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:3000/play/session-123'
    )
  })

  it('shares join link using Web Share API', async () => {
    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = false
    await act(async () => {
      success = await result.current.shareJoinLink('session-123', 'My Quiz')
    })

    expect(success).toBe(true)
    expect(navigator.share).toHaveBeenCalledWith({
      title: 'My Quiz',
      text: 'Join my trivia quiz game',
      url: 'http://localhost:3000/play/session-123',
    })
  })

  it('falls back to copy when Web Share API fails', async () => {
    ;(navigator.share as any).mockRejectedValueOnce(new Error('Share failed'))

    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = false
    await act(async () => {
      success = await result.current.shareJoinLink('session-123')
    })

    expect(success).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:3000/play/session-123'
    )
  })

  it('uses default title when sharing without title', async () => {
    const { result } = renderHook(() => useShareableLink())
    
    await act(async () => {
      await result.current.shareJoinLink('session-123')
    })

    expect(navigator.share).toHaveBeenCalledWith({
      title: 'Join my trivia quiz!',
      text: 'Join my trivia quiz game',
      url: 'http://localhost:3000/play/session-123',
    })
  })

  it('handles missing Web Share API gracefully', async () => {
    // Remove share API
    const originalShare = navigator.share
    delete (navigator as any).share

    const { result } = renderHook(() => useShareableLink())
    
    let success: boolean = false
    await act(async () => {
      success = await result.current.shareJoinLink('session-123')
    })

    expect(success).toBe(true)
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'http://localhost:3000/play/session-123'
    )

    // Restore share API
    ;(navigator as any).share = originalShare
  })
})