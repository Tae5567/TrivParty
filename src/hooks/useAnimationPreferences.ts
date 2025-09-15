import { useEffect, useState } from 'react'

/**
 * Hook to detect user's animation preferences
 * Respects the prefers-reduced-motion media query
 */
export function useAnimationPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if the browser supports matchMedia
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      
      // Set initial value
      setPrefersReducedMotion(mediaQuery.matches)
      
      // Listen for changes
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches)
      }
      
      // Use the newer addEventListener if available, fallback to addListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange)
        return () => mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  return {
    prefersReducedMotion,
    // Helper function to get animation duration based on preference
    getAnimationDuration: (normalDuration: number) => 
      prefersReducedMotion ? 0 : normalDuration,
    // Helper function to get animation config
    getAnimationConfig: <T extends Record<string, unknown>>(config: T) => 
      prefersReducedMotion ? { ...config, duration: 0 } : config
  }
}

/**
 * Hook for managing animation states and timing
 */
export function useAnimationState(initialState = false) {
  const [isAnimating, setIsAnimating] = useState(initialState)
  const { prefersReducedMotion } = useAnimationPreferences()

  const startAnimation = () => {
    if (!prefersReducedMotion) {
      setIsAnimating(true)
    }
  }

  const stopAnimation = () => {
    setIsAnimating(false)
  }

  const withAnimation = (callback: () => void, duration = 300) => {
    if (prefersReducedMotion) {
      callback()
      return
    }

    startAnimation()
    setTimeout(() => {
      callback()
      stopAnimation()
    }, duration)
  }

  return {
    isAnimating,
    startAnimation,
    stopAnimation,
    withAnimation,
    prefersReducedMotion
  }
}