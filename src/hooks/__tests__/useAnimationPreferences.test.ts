import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAnimationPreferences, useAnimationState } from '../useAnimationPreferences'

// Mock matchMedia
const mockMatchMedia = vi.fn()

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useAnimationPreferences', () => {
  it('should return false for prefersReducedMotion when not supported', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationPreferences())

    expect(result.current.prefersReducedMotion).toBe(false)
  })

  it('should return true for prefersReducedMotion when user prefers reduced motion', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationPreferences())

    expect(result.current.prefersReducedMotion).toBe(true)
  })

  it('should handle media query changes', () => {
    let changeHandler: (event: MediaQueryListEvent) => void

    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationPreferences())

    expect(result.current.prefersReducedMotion).toBe(false)

    // Simulate media query change
    act(() => {
      changeHandler({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current.prefersReducedMotion).toBe(true)
  })

  it('should fallback to addListener for older browsers', () => {
    let changeHandler: (event: MediaQueryListEvent) => void

    mockMatchMedia.mockReturnValue({
      matches: false,
      addListener: vi.fn((handler) => {
        changeHandler = handler
      }),
      removeListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationPreferences())

    expect(result.current.prefersReducedMotion).toBe(false)

    // Simulate media query change
    act(() => {
      changeHandler({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current.prefersReducedMotion).toBe(true)
  })

  it('should return correct animation duration based on preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationPreferences())

    expect(result.current.getAnimationDuration(300)).toBe(300)

    // Change to reduced motion
    act(() => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
    })

    const { result: result2 } = renderHook(() => useAnimationPreferences())
    expect(result2.current.getAnimationDuration(300)).toBe(0)
  })

  it('should return correct animation config based on preference', () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationPreferences())

    const config = { duration: 300, ease: 'easeInOut' }
    expect(result.current.getAnimationConfig(config)).toEqual(config)

    // Test with reduced motion
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result: result2 } = renderHook(() => useAnimationPreferences())
    expect(result2.current.getAnimationConfig(config)).toEqual({
      duration: 0,
      ease: 'easeInOut'
    })
  })

  it('should handle missing matchMedia gracefully', () => {
    const originalMatchMedia = window.matchMedia
    // @ts-expect-error - Testing missing matchMedia
    window.matchMedia = undefined

    const { result } = renderHook(() => useAnimationPreferences())

    expect(result.current.prefersReducedMotion).toBe(false)
    
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia
  })
})

describe('useAnimationState', () => {
  beforeEach(() => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with correct state', () => {
    const { result } = renderHook(() => useAnimationState(true))

    expect(result.current.isAnimating).toBe(true)
    expect(result.current.prefersReducedMotion).toBe(false)
  })

  it('should start and stop animations', () => {
    const { result } = renderHook(() => useAnimationState())

    expect(result.current.isAnimating).toBe(false)

    act(() => {
      result.current.startAnimation()
    })

    expect(result.current.isAnimating).toBe(true)

    act(() => {
      result.current.stopAnimation()
    })

    expect(result.current.isAnimating).toBe(false)
  })

  it('should not start animation when reduced motion is preferred', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const { result } = renderHook(() => useAnimationState())

    act(() => {
      result.current.startAnimation()
    })

    expect(result.current.isAnimating).toBe(false)
  })

  it('should execute callback with animation timing', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useAnimationState())

    act(() => {
      result.current.withAnimation(callback, 300)
    })

    expect(result.current.isAnimating).toBe(true)
    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalled()
    expect(result.current.isAnimating).toBe(false)
  })

  it('should execute callback immediately when reduced motion is preferred', () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })

    const callback = vi.fn()
    const { result } = renderHook(() => useAnimationState())

    act(() => {
      result.current.withAnimation(callback, 300)
    })

    expect(callback).toHaveBeenCalled()
    expect(result.current.isAnimating).toBe(false)
  })

  it('should use default duration when not specified', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useAnimationState())

    act(() => {
      result.current.withAnimation(callback)
    })

    expect(result.current.isAnimating).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalled()
    expect(result.current.isAnimating).toBe(false)
  })
})