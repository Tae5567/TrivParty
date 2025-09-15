import { useCallback, useRef, useState, useEffect } from 'react'

interface SoundEffectsConfig {
  enabled: boolean
  volume: number
}

interface SoundEffect {
  name: string
  frequency: number
  duration: number
  type: 'sine' | 'square' | 'sawtooth' | 'triangle'
  volume?: number
}

// Predefined sound effects using Web Audio API
const SOUND_EFFECTS: Record<string, SoundEffect> = {
  correctAnswer: {
    name: 'Correct Answer',
    frequency: 523.25, // C5 note
    duration: 300,
    type: 'sine',
    volume: 0.3
  },
  incorrectAnswer: {
    name: 'Incorrect Answer',
    frequency: 220, // A3 note
    duration: 500,
    type: 'square',
    volume: 0.2
  },
  buttonClick: {
    name: 'Button Click',
    frequency: 800,
    duration: 100,
    type: 'sine',
    volume: 0.1
  },
  buttonHover: {
    name: 'Button Hover',
    frequency: 600,
    duration: 50,
    type: 'sine',
    volume: 0.05
  },
  gameStart: {
    name: 'Game Start',
    frequency: 440, // A4 note
    duration: 200,
    type: 'triangle',
    volume: 0.2
  },
  gameEnd: {
    name: 'Game End',
    frequency: 330, // E4 note
    duration: 800,
    type: 'sine',
    volume: 0.3
  },
  playerJoin: {
    name: 'Player Join',
    frequency: 660, // E5 note
    duration: 150,
    type: 'triangle',
    volume: 0.15
  },
  countdown: {
    name: 'Countdown Tick',
    frequency: 1000,
    duration: 100,
    type: 'square',
    volume: 0.1
  },
  winner: {
    name: 'Winner Celebration',
    frequency: 784, // G5 note
    duration: 600,
    type: 'sine',
    volume: 0.4
  },
  achievement: {
    name: 'Achievement Unlock',
    frequency: 880, // A5 note
    duration: 400,
    type: 'triangle',
    volume: 0.3
  },
  powerUp: {
    name: 'Power Up',
    frequency: 1200,
    duration: 250,
    type: 'square',
    volume: 0.2
  },
  levelUp: {
    name: 'Level Up',
    frequency: 523.25, // C5 note
    duration: 800,
    type: 'sine',
    volume: 0.35
  }
}

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const [config, setConfig] = useState<SoundEffectsConfig>({
    enabled: true,
    volume: 0.5
  })

  // Initialize audio context on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('Web Audio API not supported:', error)
      }
    }
  }, [])

  // Load user preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('soundEffectsConfig')
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig))
        } catch (error) {
          console.warn('Failed to parse sound effects config:', error)
        }
      }
    }
  }, [])

  // Save config to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundEffectsConfig', JSON.stringify(config))
    }
  }, [config])

  const playSound = useCallback((soundName: keyof typeof SOUND_EFFECTS, customVolume?: number) => {
    if (!config.enabled) return

    initAudioContext()
    
    const audioContext = audioContextRef.current
    if (!audioContext) return

    const sound = SOUND_EFFECTS[soundName]
    if (!sound) return

    try {
      // Resume audio context if it's suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(sound.frequency, audioContext.currentTime)
      oscillator.type = sound.type

      const volume = (customVolume ?? sound.volume ?? 0.1) * config.volume
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + sound.duration / 1000)
    } catch (error) {
      console.warn('Failed to play sound:', error)
    }
  }, [config, initAudioContext])

  // Play a sequence of sounds (for more complex effects)
  const playSoundSequence = useCallback((sounds: Array<{ sound: keyof typeof SOUND_EFFECTS; delay: number }>) => {
    sounds.forEach(({ sound, delay }) => {
      setTimeout(() => playSound(sound), delay)
    })
  }, [playSound])

  // Play celebration sound (multiple notes)
  const playCelebration = useCallback(() => {
    if (!config.enabled) return

    const celebrationSequence = [
      { sound: 'correctAnswer' as const, delay: 0 },
      { sound: 'achievement' as const, delay: 150 },
      { sound: 'winner' as const, delay: 300 },
      { sound: 'levelUp' as const, delay: 500 }
    ]
    
    playSoundSequence(celebrationSequence)
  }, [config.enabled, playSoundSequence])

  // Play victory fanfare (for game completion)
  const playVictoryFanfare = useCallback(() => {
    if (!config.enabled) return

    const fanfareSequence = [
      { sound: 'winner' as const, delay: 0 },
      { sound: 'achievement' as const, delay: 200 },
      { sound: 'levelUp' as const, delay: 400 },
      { sound: 'correctAnswer' as const, delay: 600 },
      { sound: 'gameEnd' as const, delay: 800 }
    ]
    
    playSoundSequence(fanfareSequence)
  }, [config.enabled, playSoundSequence])

  const updateConfig = useCallback((newConfig: Partial<SoundEffectsConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  const toggleEnabled = useCallback(() => {
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    setConfig(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }))
  }, [])

  return {
    playSound,
    playSoundSequence,
    playCelebration,
    playVictoryFanfare,
    config,
    updateConfig,
    toggleEnabled,
    setVolume,
    isSupported: typeof window !== 'undefined' && 
      (window.AudioContext || (window as any).webkitAudioContext)
  }
}

// Hook for managing sound effects in components
export function useGameSounds() {
  const { playSound, playCelebration, playVictoryFanfare, config } = useSoundEffects()

  return {
    playCorrectAnswer: () => playSound('correctAnswer'),
    playIncorrectAnswer: () => playSound('incorrectAnswer'),
    playButtonClick: () => playSound('buttonClick'),
    playButtonHover: () => playSound('buttonHover'),
    playGameStart: () => playSound('gameStart'),
    playGameEnd: () => playSound('gameEnd'),
    playPlayerJoin: () => playSound('playerJoin'),
    playCountdown: () => playSound('countdown'),
    playWinner: () => playSound('winner'),
    playAchievement: () => playSound('achievement'),
    playPowerUp: () => playSound('powerUp'),
    playPowerUpActivate: () => playSound('powerUp'),
    playDoublePoints: () => playSound('achievement'),
    playLevelUp: () => playSound('levelUp'),
    playCelebration,
    playVictoryFanfare,
    isEnabled: config.enabled
  }
}