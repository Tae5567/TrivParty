import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnswerSubmission } from '../AnswerSubmission'
import type { Question } from '@/types'

// Mock all the hooks and dependencies
vi.mock('@/hooks/useAnimationPreferences', () => ({
  useAnimationPreferences: () => ({ prefersReducedMotion: false })
}))

vi.mock('@/hooks/useSoundEffects', () => ({
  useGameSounds: () => ({
    playButtonClick: vi.fn(),
    playCountdown: vi.fn(),
    playPowerUpActivate: vi.fn()
  })
}))

vi.mock('@/hooks/usePowerUps', () => ({
  usePowerUps: () => ({
    powerUps: [
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
        usesRemaining: 1,
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
    ],
    loading: false,
    error: null,
    usePowerUpAction: vi.fn().mockResolvedValue({ success: true, message: 'Power-up used successfully' }),
    refreshPowerUps: vi.fn(),
    initializePowerUps: vi.fn()
  })
}))

vi.mock('@/lib/power-ups', () => ({
  wasPowerUpUsed: vi.fn().mockResolvedValue(false)
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => children
}))

describe('Power-ups Integration', () => {
  const mockQuestion: Question = {
    id: 'question-1',
    quizId: 'quiz-1',
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    explanation: 'Paris is the capital of France',
    questionOrder: 1
  }

  const mockOnSubmitAnswer = vi.fn()
  const mockOnSkipQuestion = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders answer submission with power-up panel when playerId is provided', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={30}
        playersAnswered={0}
        totalPlayers={2}
        playerId="player-1"
        onSkipQuestion={mockOnSkipQuestion}
      />
    )

    // Check that the question is displayed
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()

    // Check that power-up panel is displayed
    expect(screen.getByText('Power-Ups')).toBeInTheDocument()
    expect(screen.getByText('SKIP QUESTION')).toBeInTheDocument()
    expect(screen.getByText('DOUBLE POINTS')).toBeInTheDocument()
    expect(screen.getByText('FIFTY FIFTY')).toBeInTheDocument()
  })

  it('does not render power-up panel when playerId is not provided', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={30}
        playersAnswered={0}
        totalPlayers={2}
      />
    )

    // Check that the question is displayed
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()

    // Check that power-up panel is NOT displayed
    expect(screen.queryByText('Power-Ups')).not.toBeInTheDocument()
  })

  it('shows skip question confirmation when skip power-up is used', async () => {
    const { usePowerUpAction } = await import('@/hooks/usePowerUps')
    const mockUsePowerUpAction = vi.mocked(usePowerUpAction())

    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={30}
        playersAnswered={0}
        totalPlayers={2}
        playerId="player-1"
        onSkipQuestion={mockOnSkipQuestion}
      />
    )

    // Click the skip question power-up
    const skipButton = screen.getByText('SKIP QUESTION').closest('button')
    fireEvent.click(skipButton!)

    await waitFor(() => {
      expect(mockUsePowerUpAction.usePowerUpAction).toHaveBeenCalledWith('skip_question')
    })
  })

  it('allows normal answer submission when no power-ups are used', async () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={30}
        playersAnswered={0}
        totalPlayers={2}
        playerId="player-1"
        onSkipQuestion={mockOnSkipQuestion}
      />
    )

    // Select an answer
    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    // Submit the answer
    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    expect(mockOnSubmitAnswer).toHaveBeenCalledWith('Paris')
  })

  it('maintains responsive layout with power-up panel', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={30}
        playersAnswered={0}
        totalPlayers={2}
        playerId="player-1"
        onSkipQuestion={mockOnSkipQuestion}
      />
    )

    // Check that the layout uses grid classes for responsive design
    const container = screen.getByText('What is the capital of France?').closest('.grid')
    expect(container).toHaveClass('grid-cols-1', 'lg:grid-cols-4')
  })
})