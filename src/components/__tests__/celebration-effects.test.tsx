import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Confetti, SimpleConfetti } from '@/components/ui/Confetti'
import { WinnerCelebration, PodiumCelebration } from '@/components/ui/WinnerCelebration'
import { FeedbackButton, AnswerOption } from '@/components/ui/FeedbackButton'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}))

// Mock hooks
vi.mock('@/hooks/useAnimationPreferences', () => ({
  useAnimationPreferences: () => ({
    prefersReducedMotion: false,
    getAnimationDuration: (duration: number) => duration,
    getAnimationConfig: (config: any) => config
  })
}))

vi.mock('@/hooks/useSoundEffects', () => ({
  useGameSounds: () => ({
    playCorrectAnswer: vi.fn(),
    playIncorrectAnswer: vi.fn(),
    playButtonClick: vi.fn(),
    playButtonHover: vi.fn(),
    playGameStart: vi.fn(),
    playGameEnd: vi.fn(),
    playPlayerJoin: vi.fn(),
    playCountdown: vi.fn(),
    playWinner: vi.fn(),
    playCelebration: vi.fn(),
    isEnabled: true
  }),
  useSoundEffects: () => ({
    playSound: vi.fn(),
    playSoundSequence: vi.fn(),
    playCelebration: vi.fn(),
    config: { enabled: true, volume: 0.5 },
    updateConfig: vi.fn(),
    toggleEnabled: vi.fn(),
    setVolume: vi.fn(),
    isSupported: true
  })
}))

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn()
})

describe('Confetti Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 })
  })

  describe('Confetti', () => {
    it('renders confetti particles when visible', () => {
      const { container } = render(
        <Confetti isVisible={true} particleCount={5} />
      )
      
      expect(container.querySelector('.fixed')).toBeInTheDocument()
    })

    it('does not render when not visible', () => {
      const { container } = render(
        <Confetti isVisible={false} />
      )
      
      expect(container.querySelector('.fixed')).not.toBeInTheDocument()
    })

    it('calls onComplete after duration', async () => {
      const onComplete = vi.fn()
      
      render(
        <Confetti 
          isVisible={true} 
          duration={100} 
          onComplete={onComplete}
        />
      )
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 200 })
    })

    it('respects reduced motion preference', () => {
      vi.mocked(require('@/hooks/useAnimationPreferences').useAnimationPreferences).mockReturnValue({
        prefersReducedMotion: true,
        getAnimationDuration: () => 0,
        getAnimationConfig: (config: any) => ({ ...config, duration: 0 })
      })

      const { container } = render(
        <Confetti isVisible={true} />
      )
      
      expect(container.querySelector('.fixed')).not.toBeInTheDocument()
    })
  })

  describe('SimpleConfetti', () => {
    it('renders confetti container when visible', () => {
      const { container } = render(
        <SimpleConfetti isVisible={true} />
      )
      
      expect(container.querySelector('.confetti-container')).toBeInTheDocument()
    })

    it('calls onComplete after duration', async () => {
      const onComplete = vi.fn()
      
      render(
        <SimpleConfetti 
          isVisible={true} 
          duration={100} 
          onComplete={onComplete}
        />
      )
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 200 })
    })
  })
})

describe('Winner Celebration Components', () => {
  describe('WinnerCelebration', () => {
    it('renders winner information when visible', () => {
      render(
        <WinnerCelebration
          winnerName="Test Player"
          winnerScore={100}
          isVisible={true}
        />
      )
      
      expect(screen.getByText('Test Player')).toBeInTheDocument()
      expect(screen.getByText('100 points')).toBeInTheDocument()
      expect(screen.getByText('🎉 Winner! 🎉')).toBeInTheDocument()
    })

    it('does not render when not visible', () => {
      render(
        <WinnerCelebration
          winnerName="Test Player"
          winnerScore={100}
          isVisible={false}
        />
      )
      
      expect(screen.queryByText('Test Player')).not.toBeInTheDocument()
    })

    it('calls onComplete after animation', async () => {
      const onComplete = vi.fn()
      
      render(
        <WinnerCelebration
          winnerName="Test Player"
          winnerScore={100}
          isVisible={true}
          onComplete={onComplete}
        />
      )
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 5000 })
    })

    it('shows confetti when enabled', () => {
      const { container } = render(
        <WinnerCelebration
          winnerName="Test Player"
          winnerScore={100}
          isVisible={true}
          showConfetti={true}
        />
      )
      
      // Should render confetti component
      expect(container.querySelector('.confetti-container')).toBeInTheDocument()
    })
  })

  describe('PodiumCelebration', () => {
    const mockPlayers = [
      { name: 'Player 1', score: 100, rank: 1 },
      { name: 'Player 2', score: 80, rank: 2 },
      { name: 'Player 3', score: 60, rank: 3 }
    ]

    it('renders podium with top players', () => {
      render(
        <PodiumCelebration
          topPlayers={mockPlayers}
          isVisible={true}
        />
      )
      
      expect(screen.getByText('🏆 Final Results 🏆')).toBeInTheDocument()
      expect(screen.getByText('Player 1')).toBeInTheDocument()
      expect(screen.getByText('Player 2')).toBeInTheDocument()
      expect(screen.getByText('Player 3')).toBeInTheDocument()
    })

    it('calls onComplete after animation', async () => {
      const onComplete = vi.fn()
      
      render(
        <PodiumCelebration
          topPlayers={mockPlayers}
          isVisible={true}
          onComplete={onComplete}
        />
      )
      
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      }, { timeout: 6000 })
    })
  })
})

describe('Feedback Components', () => {
  describe('FeedbackButton', () => {
    it('renders button with children', () => {
      render(
        <FeedbackButton>
          Test Button
        </FeedbackButton>
      )
      
      expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
    })

    it('plays sound on click when enabled', () => {
      const mockPlayButtonClick = vi.fn()
      vi.mocked(require('@/hooks/useSoundEffects').useGameSounds).mockReturnValue({
        playButtonClick: mockPlayButtonClick,
        playButtonHover: vi.fn(),
        isEnabled: true
      })

      render(
        <FeedbackButton enableSounds={true}>
          Test Button
        </FeedbackButton>
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockPlayButtonClick).toHaveBeenCalled()
    })

    it('plays hover sound on mouse enter when enabled', () => {
      const mockPlayButtonHover = vi.fn()
      vi.mocked(require('@/hooks/useSoundEffects').useGameSounds).mockReturnValue({
        playButtonClick: vi.fn(),
        playButtonHover: mockPlayButtonHover,
        isEnabled: true
      })

      render(
        <FeedbackButton enableSounds={true}>
          Test Button
        </FeedbackButton>
      )
      
      fireEvent.mouseEnter(screen.getByRole('button'))
      expect(mockPlayButtonHover).toHaveBeenCalled()
    })

    it('triggers haptic feedback on click when enabled', () => {
      const mockVibrate = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate
      })

      render(
        <FeedbackButton enableHaptics={true}>
          Test Button
        </FeedbackButton>
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockVibrate).toHaveBeenCalledWith(50)
    })

    it('applies correct feedback colors based on type', () => {
      const { rerender } = render(
        <FeedbackButton feedbackType="success">
          Success Button
        </FeedbackButton>
      )
      
      let button = screen.getByRole('button')
      expect(button).toHaveClass('hover:shadow-green-200')
      
      rerender(
        <FeedbackButton feedbackType="error">
          Error Button
        </FeedbackButton>
      )
      
      button = screen.getByRole('button')
      expect(button).toHaveClass('hover:shadow-red-200')
    })

    it('does not trigger effects when disabled', () => {
      const mockPlayButtonClick = vi.fn()
      const mockVibrate = vi.fn()
      
      vi.mocked(require('@/hooks/useSoundEffects').useGameSounds).mockReturnValue({
        playButtonClick: mockPlayButtonClick,
        playButtonHover: vi.fn(),
        isEnabled: true
      })
      
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate
      })

      render(
        <FeedbackButton disabled={true}>
          Disabled Button
        </FeedbackButton>
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(mockPlayButtonClick).not.toHaveBeenCalled()
      expect(mockVibrate).not.toHaveBeenCalled()
    })
  })

  describe('AnswerOption', () => {
    it('renders option with correct letter and text', () => {
      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={false}
        />
      )
      
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('Test Answer')).toBeInTheDocument()
    })

    it('shows selection indicator when selected', () => {
      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={true}
        />
      )
      
      const checkIcon = screen.getByRole('button').querySelector('svg')
      expect(checkIcon).toBeInTheDocument()
    })

    it('applies correct styles for correct answer', () => {
      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={false}
          isCorrect={true}
          showResults={true}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-100')
    })

    it('applies correct styles for incorrect answer', () => {
      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={true}
          isIncorrect={true}
          showResults={true}
        />
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-100')
    })

    it('calls onClick when clicked and not disabled', () => {
      const onClick = vi.fn()
      
      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={false}
          onClick={onClick}
        />
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(onClick).toHaveBeenCalled()
    })

    it('does not call onClick when disabled', () => {
      const onClick = vi.fn()
      
      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={false}
          disabled={true}
          onClick={onClick}
        />
      )
      
      fireEvent.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })

    it('plays hover sound on mouse enter', () => {
      const mockPlayButtonHover = vi.fn()
      vi.mocked(require('@/hooks/useSoundEffects').useGameSounds).mockReturnValue({
        playButtonHover: mockPlayButtonHover,
        isEnabled: true
      })

      render(
        <AnswerOption
          option="Test Answer"
          index={0}
          isSelected={false}
        />
      )
      
      fireEvent.mouseEnter(screen.getByRole('button'))
      expect(mockPlayButtonHover).toHaveBeenCalled()
    })
  })
})

describe('Integration Tests', () => {
  it('celebration effects work together', async () => {
    const mockPlayWinner = vi.fn()
    const mockPlayCelebration = vi.fn()
    
    vi.mocked(require('@/hooks/useSoundEffects').useGameSounds).mockReturnValue({
      playWinner: mockPlayWinner,
      playCelebration: mockPlayCelebration,
      isEnabled: true
    })

    const { container } = render(
      <WinnerCelebration
        winnerName="Test Winner"
        winnerScore={100}
        isVisible={true}
        showConfetti={true}
      />
    )
    
    // Should play winner sound immediately
    expect(mockPlayWinner).toHaveBeenCalled()
    
    // Should show confetti
    await waitFor(() => {
      expect(container.querySelector('.confetti-container')).toBeInTheDocument()
    })
    
    // Should play celebration sequence after delay
    await waitFor(() => {
      expect(mockPlayCelebration).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('feedback button with answer option integration', () => {
    const mockPlayButtonClick = vi.fn()
    const mockPlayButtonHover = vi.fn()
    
    vi.mocked(require('@/hooks/useSoundEffects').useGameSounds).mockReturnValue({
      playButtonClick: mockPlayButtonClick,
      playButtonHover: mockPlayButtonHover,
      isEnabled: true
    })

    const onClick = vi.fn()
    
    render(
      <AnswerOption
        option="Test Answer"
        index={0}
        isSelected={false}
        onClick={onClick}
      />
    )
    
    const button = screen.getByRole('button')
    
    // Test hover sound
    fireEvent.mouseEnter(button)
    expect(mockPlayButtonHover).toHaveBeenCalled()
    
    // Test click
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })
})