import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSoundEffects, useGameSounds } from '@/hooks/useSoundEffects'

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: vi.fn(),
  createGain: vi.fn(),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: vi.fn()
}

const mockOscillator = {
  connect: vi.fn(),
  frequency: {
    setValueAtTime: vi.fn()
  },
  type: 'sine',
  start: vi.fn(),
  stop: vi.fn()
}

const mockGainNode = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn()
  }
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock AudioContext
Object.defineProperty(window, 'AudioContext', {
  value: vi.fn(() => mockAudioContext)
})

Object.defineProperty(window, 'webkitAudioContext', {
  value: vi.fn(() => mockAudioContext)
})

describe('useSoundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAudioContext.createOscillator.mockReturnValue(mockOscillator)
    mockAudioContext.createGain.mockReturnValue(mockGainNode)
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default config', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    expect(result.current.config).toEqual({
      enabled: true,
      volume: 0.5
    })
    expect(result.current.isSupported).toBe(true)
  })

  it('loads config from localStorage', () => {
    const savedConfig = JSON.stringify({ enabled: false, volume: 0.8 })
    mockLocalStorage.getItem.mockReturnValue(savedConfig)
    
    const { result } = renderHook(() => useSoundEffects())
    
    expect(result.current.config).toEqual({
      enabled: false,
      volume: 0.8
    })
  })

  it('saves config to localStorage when updated', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.updateConfig({ volume: 0.7 })
    })
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'soundEffectsConfig',
      JSON.stringify({ enabled: true, volume: 0.7 })
    )
  })

  it('toggles enabled state', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.toggleEnabled()
    })
    
    expect(result.current.config.enabled).toBe(false)
    
    act(() => {
      result.current.toggleEnabled()
    })
    
    expect(result.current.config.enabled).toBe(true)
  })

  it('sets volume within valid range', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.setVolume(1.5) // Above max
    })
    
    expect(result.current.config.volume).toBe(1)
    
    act(() => {
      result.current.setVolume(-0.5) // Below min
    })
    
    expect(result.current.config.volume).toBe(0)
    
    act(() => {
      result.current.setVolume(0.3) // Valid range
    })
    
    expect(result.current.config.volume).toBe(0.3)
  })

  it('plays sound when enabled', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.playSound('correctAnswer')
    })
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    expect(mockAudioContext.createGain).toHaveBeenCalled()
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode)
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination)
    expect(mockOscillator.start).toHaveBeenCalled()
    expect(mockOscillator.stop).toHaveBeenCalled()
  })

  it('does not play sound when disabled', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.updateConfig({ enabled: false })
    })
    
    act(() => {
      result.current.playSound('correctAnswer')
    })
    
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
  })

  it('resumes audio context if suspended', () => {
    mockAudioContext.state = 'suspended'
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.playSound('correctAnswer')
    })
    
    expect(mockAudioContext.resume).toHaveBeenCalled()
  })

  it('handles audio context creation errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Mock AudioContext to throw error
    Object.defineProperty(window, 'AudioContext', {
      value: vi.fn(() => {
        throw new Error('AudioContext not supported')
      })
    })
    
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.playSound('correctAnswer')
    })
    
    // Should not throw error
    expect(consoleSpy).toHaveBeenCalledWith('Web Audio API not supported:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('plays sound sequence with delays', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useSoundEffects())
    
    const sequence = [
      { sound: 'correctAnswer' as const, delay: 0 },
      { sound: 'winner' as const, delay: 200 },
      { sound: 'gameEnd' as const, delay: 400 }
    ]
    
    act(() => {
      result.current.playSoundSequence(sequence)
    })
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1)
    
    act(() => {
      vi.advanceTimersByTime(200)
    })
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2)
    
    act(() => {
      vi.advanceTimersByTime(200)
    })
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3)
    
    vi.useRealTimers()
  })

  it('plays celebration sequence', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.playCelebration()
    })
    
    // Should play multiple sounds in sequence
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
  })

  it('uses custom volume when provided', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.playSound('correctAnswer', 0.8)
    })
    
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(
      0.8 * 0.5, // custom volume * config volume
      mockAudioContext.currentTime
    )
  })

  it('handles invalid sound names gracefully', () => {
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      // @ts-ignore - Testing invalid sound name
      result.current.playSound('invalidSound')
    })
    
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
  })

  it('detects Web Audio API support correctly', () => {
    const { result } = renderHook(() => useSoundEffects())
    expect(result.current.isSupported).toBe(true)
    
    // Test without AudioContext
    delete (window as any).AudioContext
    delete (window as any).webkitAudioContext
    
    const { result: result2 } = renderHook(() => useSoundEffects())
    expect(result2.current.isSupported).toBe(false)
  })
})

describe('useGameSounds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAudioContext.createOscillator.mockReturnValue(mockOscillator)
    mockAudioContext.createGain.mockReturnValue(mockGainNode)
  })

  it('provides game-specific sound functions', () => {
    const { result } = renderHook(() => useGameSounds())
    
    expect(typeof result.current.playCorrectAnswer).toBe('function')
    expect(typeof result.current.playIncorrectAnswer).toBe('function')
    expect(typeof result.current.playButtonClick).toBe('function')
    expect(typeof result.current.playButtonHover).toBe('function')
    expect(typeof result.current.playGameStart).toBe('function')
    expect(typeof result.current.playGameEnd).toBe('function')
    expect(typeof result.current.playPlayerJoin).toBe('function')
    expect(typeof result.current.playCountdown).toBe('function')
    expect(typeof result.current.playWinner).toBe('function')
    expect(typeof result.current.playCelebration).toBe('function')
  })

  it('plays correct answer sound', () => {
    const { result } = renderHook(() => useGameSounds())
    
    act(() => {
      result.current.playCorrectAnswer()
    })
    
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
      523.25, // C5 note frequency
      mockAudioContext.currentTime
    )
    expect(mockOscillator.type).toBe('sine')
  })

  it('plays incorrect answer sound', () => {
    const { result } = renderHook(() => useGameSounds())
    
    act(() => {
      result.current.playIncorrectAnswer()
    })
    
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
      220, // A3 note frequency
      mockAudioContext.currentTime
    )
  })

  it('plays button interaction sounds', () => {
    const { result } = renderHook(() => useGameSounds())
    
    act(() => {
      result.current.playButtonClick()
    })
    
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
      800,
      mockAudioContext.currentTime
    )
    
    act(() => {
      result.current.playButtonHover()
    })
    
    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(
      600,
      mockAudioContext.currentTime
    )
  })

  it('returns enabled state from config', () => {
    const { result } = renderHook(() => useGameSounds())
    
    expect(result.current.isEnabled).toBe(true)
  })

  it('plays celebration with multiple sounds', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useGameSounds())
    
    act(() => {
      result.current.playCelebration()
    })
    
    // Should start playing sounds immediately
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    
    vi.useRealTimers()
  })
})

describe('Error Handling', () => {
  it('handles oscillator creation errors', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockAudioContext.createOscillator.mockImplementation(() => {
      throw new Error('Failed to create oscillator')
    })
    
    const { result } = renderHook(() => useSoundEffects())
    
    act(() => {
      result.current.playSound('correctAnswer')
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to play sound:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })

  it('handles localStorage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage not available')
    })
    
    // Should not throw error during initialization
    const { result } = renderHook(() => useSoundEffects())
    
    expect(result.current.config).toEqual({
      enabled: true,
      volume: 0.5
    })
    
    consoleSpy.mockRestore()
  })

  it('handles JSON parsing errors in localStorage', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockLocalStorage.getItem.mockReturnValue('invalid json')
    
    const { result } = renderHook(() => useSoundEffects())
    
    expect(result.current.config).toEqual({
      enabled: true,
      volume: 0.5
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse sound effects config:', expect.any(Error))
    
    consoleSpy.mockRestore()
  })
})