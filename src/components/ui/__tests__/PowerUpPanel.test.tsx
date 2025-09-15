import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PowerUpPanel } from '../PowerUpPanel'
import type { PlayerPowerUp } from '@/types'

// Mock hooks
vi.mock('@/hooks/useAnimationPreferences', () => ({
  useAnimationPreferences: () => ({ prefersReducedMotion: false })
}))

vi.mock('@/hooks/useSoundEffects', () => ({
  useGameSounds: () => ({
    playButtonClick: vi.fn(),
    playPowerUpActivate: vi.fn()
  })
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: unknown) => children
}))

describe('PowerUpPanel', () => {
  const mockPowerUps: PlayerPowerUp[] = [
    {
      id: 'player-power-up-1',
      playerId: 'player-1',
      powerUpId: 'power-up-1',
      usesRemaining: 1,
      createdAt: '2024-01-01T00:00:00Z',
      powerUp: {
        id: 'power-up-1',
        name: 'skip_question',
        description: 'Skip a difficult question without penalty',
        icon: 'SkipForward',
        maxUsesPerGame: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'player-power-up-2',
      playerId: 'player-1',
      powerUpId: 'power-up-2',
      usesRemaining: 1,
      createdAt: '2024-01-01T00:00:00Z',
      powerUp: {
        id: 'power-up-2',
        name: 'double_points',
        description: 'Double points for the next correct answer',
        icon: 'Zap',
        maxUsesPerGame: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }
    },
    {
      id: 'player-power-up-3',
      playerId: 'player-1',
      powerUpId: 'power-up-3',
      usesRemaining: 0,
      createdAt: '2024-01-01T00:00:00Z',
      powerUp: {
        id: 'power-up-3',
        name: 'fifty_fifty',
        description: 'Remove two incorrect answer options',
        icon: 'Target',
        maxUsesPerGame: 1,
        createdAt: '2024-01-01T00:00:00Z'
      }
    }
  ]

  const mockOnUsePowerUp = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders power-up panel with title', () => {
    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    expect(screen.getByText('Power-Ups')).toBeInTheDocument()
    expect(screen.getByText('Use power-ups strategically to gain an advantage!')).toBeInTheDocument()
  })

  it('renders all power-up buttons with correct labels', () => {
    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    expect(screen.getByText('SKIP QUESTION')).toBeInTheDocument()
    expect(screen.getByText('DOUBLE POINTS')).toBeInTheDocument()
    expect(screen.getByText('FIFTY FIFTY')).toBeInTheDocument()
  })

  it('displays correct number of uses remaining for each power-up', () => {
    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    // Check badges showing uses remaining
    const badges = screen.getAllByText('1')
    expect(badges).toHaveLength(2) // Skip question and double points have 1 use

    const zeroBadge = screen.getByText('0')
    expect(zeroBadge).toBeInTheDocument() // Fifty fifty has 0 uses
  })

  it('disables power-up buttons when no uses remaining', () => {
    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const fiftyFiftyButton = screen.getByText('FIFTY FIFTY').closest('button')
    expect(fiftyFiftyButton).toBeDisabled()
  })

  it('enables power-up buttons when uses remaining', () => {
    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    const doublePointsButton = screen.getByText('DOUBLE POINTS').closest('button')
    
    expect(skipButton).not.toBeDisabled()
    expect(doublePointsButton).not.toBeDisabled()
  })

  it('calls onUsePowerUp when power-up button is clicked', async () => {
    mockOnUsePowerUp.mockResolvedValue({ success: true, message: 'Power-up used successfully' })

    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    fireEvent.click(skipButton!)

    await waitFor(() => {
      expect(mockOnUsePowerUp).toHaveBeenCalledWith('skip_question')
    })
  })

  it('shows success feedback when power-up is used successfully', async () => {
    mockOnUsePowerUp.mockResolvedValue({ success: true, message: 'Power-up used successfully' })

    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    fireEvent.click(skipButton!)

    await waitFor(() => {
      expect(screen.getByText('Power-up used successfully')).toBeInTheDocument()
    })
  })

  it('shows error feedback when power-up usage fails', async () => {
    mockOnUsePowerUp.mockResolvedValue({ success: false, message: 'No uses remaining' })

    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    fireEvent.click(skipButton!)

    await waitFor(() => {
      expect(screen.getByText('No uses remaining')).toBeInTheDocument()
    })
  })

  it('disables all buttons when disabled prop is true', () => {
    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
        disabled={true}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    const doublePointsButton = screen.getByText('DOUBLE POINTS').closest('button')
    const fiftyFiftyButton = screen.getByText('FIFTY FIFTY').closest('button')
    
    expect(skipButton).toBeDisabled()
    expect(doublePointsButton).toBeDisabled()
    expect(fiftyFiftyButton).toBeDisabled()
  })

  it('prevents multiple simultaneous power-up usage', async () => {
    mockOnUsePowerUp.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, message: 'Success' }), 10)
    ))

    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    const doublePointsButton = screen.getByText('DOUBLE POINTS').closest('button')
    
    // Click both buttons quickly
    fireEvent.click(skipButton!)
    fireEvent.click(doublePointsButton!)

    // Only one should be called
    await waitFor(() => {
      expect(mockOnUsePowerUp).toHaveBeenCalledTimes(1)
    }, { timeout: 100 })
  })

  it('handles power-up usage errors gracefully', async () => {
    mockOnUsePowerUp.mockRejectedValue(new Error('Network error'))

    render(
      <PowerUpPanel
        playerPowerUps={mockPowerUps}
        onUsePowerUp={mockOnUsePowerUp}
      />
    )

    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    fireEvent.click(skipButton!)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})