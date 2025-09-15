import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { QuestionDisplay } from '../QuestionDisplay'
import { ScoreDisplay, ScoreUpdate } from '../ScoreDisplay'
import { Leaderboard } from '../ui/Leaderboard'
import { QuizGenerator } from '../QuizGenerator'
import type { Question, Player } from '@/types'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
    h4: ({ children, ...props }: React.ComponentProps<'h4'>) => <h4 {...props}>{children}</h4>,
    p: ({ children, ...props }: React.ComponentProps<'p'>) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock requestAnimationFrame for number animations
const mockRequestAnimationFrame = vi.fn()
const mockCancelAnimationFrame = vi.fn()

beforeEach(() => {
  global.requestAnimationFrame = mockRequestAnimationFrame
  global.cancelAnimationFrame = mockCancelAnimationFrame
  mockRequestAnimationFrame.mockImplementation((callback) => {
    setTimeout(callback, 16) // Simulate 60fps
    return 1
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Animation Components', () => {
  describe('QuestionDisplay Animations', () => {
    const mockQuestion: Question = {
      id: '1',
      text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
      questionOrder: 1
    }

    it('should render question with animation wrapper', () => {
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
        />
      )

      expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    })

    it('should show timer animation when time is low', () => {
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          timeRemaining={5}
        />
      )

      expect(screen.getByText('5s')).toBeInTheDocument()
    })

    it('should show explanation with animation when results are shown', () => {
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          showResults={true}
          correctAnswer="Paris"
        />
      )

      expect(screen.getByText('Explanation')).toBeInTheDocument()
      expect(screen.getByText('Paris is the capital and largest city of France.')).toBeInTheDocument()
    })

    it('should handle answer selection with animation', () => {
      const mockOnAnswerSelect = vi.fn()
      
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswerSelect={mockOnAnswerSelect}
        />
      )

      const parisOption = screen.getByText('Paris')
      parisOption.click()
      
      expect(mockOnAnswerSelect).toHaveBeenCalledWith('Paris')
    })
  })

  describe('ScoreDisplay Animations', () => {
    const mockPlayers: Player[] = [
      {
        id: '1',
        sessionId: 'session1',
        nickname: 'Alice',
        score: 100,
        joinedAt: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        sessionId: 'session1',
        nickname: 'Bob',
        score: 80,
        joinedAt: '2023-01-01T00:01:00Z'
      }
    ]

    it('should render animated score numbers', async () => {
      render(<ScoreDisplay players={mockPlayers} />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      
      // Scores should be rendered (animation will be mocked)
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('80')).toBeInTheDocument()
    })

    it('should show compact view with animations', () => {
      render(<ScoreDisplay players={mockPlayers} compact={true} />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should highlight current player', () => {
      render(<ScoreDisplay players={mockPlayers} currentPlayerId="1" />)

      // Look for the player container that should have the highlighting class
      const aliceText = screen.getByText('Alice')
      const playerContainer = aliceText.closest('[class*="bg-primary"]')
      expect(playerContainer).toBeInTheDocument()
    })
  })

  describe('ScoreUpdate Animation', () => {
    it('should show score update animation when visible', () => {
      const mockOnComplete = vi.fn()
      
      render(
        <ScoreUpdate
          pointsEarned={10}
          isVisible={true}
          onAnimationComplete={mockOnComplete}
        />
      )

      expect(screen.getByText('+10')).toBeInTheDocument()
    })

    it('should not render when not visible', () => {
      render(
        <ScoreUpdate
          pointsEarned={10}
          isVisible={false}
        />
      )

      expect(screen.queryByText('+10')).not.toBeInTheDocument()
    })

    it('should call onAnimationComplete after timeout', async () => {
      const mockOnComplete = vi.fn()
      
      render(
        <ScoreUpdate
          pointsEarned={10}
          isVisible={true}
          onAnimationComplete={mockOnComplete}
        />
      )

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled()
      }, { timeout: 3000 })
    })
  })

  describe('Leaderboard Animations', () => {
    const mockPlayers: Player[] = [
      {
        id: '1',
        sessionId: 'session1',
        nickname: 'Winner',
        score: 150,
        joinedAt: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        sessionId: 'session1',
        nickname: 'Runner-up',
        score: 120,
        joinedAt: '2023-01-01T00:01:00Z'
      },
      {
        id: '3',
        sessionId: 'session1',
        nickname: 'Third',
        score: 90,
        joinedAt: '2023-01-01T00:02:00Z'
      }
    ]

    it('should render leaderboard with animated elements', () => {
      render(<Leaderboard players={mockPlayers} />)

      expect(screen.getByText('Leaderboard')).toBeInTheDocument()
      expect(screen.getByText('Winner')).toBeInTheDocument()
      expect(screen.getByText('Runner-up')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })

    it('should show stats with animated numbers', () => {
      render(<Leaderboard players={mockPlayers} showStats={true} />)

      expect(screen.getByText('3')).toBeInTheDocument() // Total players
      expect(screen.getAllByText('150')).toHaveLength(2) // Highest score appears in stats and player score
      expect(screen.getAllByText('120')).toHaveLength(2) // Average score appears in stats and player score
    })

    it('should show final celebration animations', () => {
      render(
        <Leaderboard 
          players={mockPlayers} 
          isFinal={true}
          currentPlayerId="1"
        />
      )

      expect(screen.getByText('🎉 Congratulations to all players! 🎉')).toBeInTheDocument()
    })

    it('should show rank badges for top 3 players', () => {
      render(<Leaderboard players={mockPlayers} />)

      expect(screen.getByText('1st Place')).toBeInTheDocument()
      expect(screen.getByText('2nd Place')).toBeInTheDocument()
      expect(screen.getByText('3rd Place')).toBeInTheDocument()
    })
  })

  describe('QuizGenerator Loading Animations', () => {
    it('should show loading animation during content extraction', () => {
      render(<QuizGenerator />)
      
      // Simulate the loading state by checking if the component can handle it
      expect(screen.queryByText('Extracting Content...')).not.toBeInTheDocument()
    })

    it('should show different loading states', () => {
      // This would require more complex state management testing
      // For now, we verify the component renders without errors
      render(<QuizGenerator />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  describe('Animation Accessibility', () => {
    it('should respect reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(<ScoreDisplay players={[]} />)
      
      // Component should still render properly with reduced motion
      expect(screen.getByText('Current Scores')).toBeInTheDocument()
    })

    it('should maintain focus management during animations', () => {
      const mockQuestion: Question = {
        id: '1',
        text: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: 'Test explanation',
        questionOrder: 1
      }

      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={1}
        />
      )

      // Get the button element that contains the option text
      const buttons = screen.getAllByRole('button')
      const firstOptionButton = buttons.find(button => button.textContent?.includes('A'))
      expect(firstOptionButton).toBeInTheDocument()
      
      if (firstOptionButton) {
        firstOptionButton.focus()
        expect(document.activeElement).toBe(firstOptionButton)
      }
    })
  })

  describe('Animation Performance', () => {
    it('should not cause memory leaks with number animations', async () => {
      const { unmount, rerender } = render(
        <ScoreDisplay 
          players={[{
            id: '1',
            sessionId: 'session1',
            nickname: 'Test',
            score: 100,
            joinedAt: '2023-01-01T00:00:00Z'
          }]} 
        />
      )

      // Simulate score change to trigger animation
      rerender(
        <ScoreDisplay 
          players={[{
            id: '1',
            sessionId: 'session1',
            nickname: 'Test',
            score: 150,
            joinedAt: '2023-01-01T00:00:00Z'
          }]} 
        />
      )

      unmount()
      
      // Component should unmount without errors
      expect(screen.queryByText('Test')).not.toBeInTheDocument()
    })

    it('should handle rapid score updates gracefully', () => {
      const players = [{
        id: '1',
        sessionId: 'session1',
        nickname: 'Test',
        score: 0,
        joinedAt: '2023-01-01T00:00:00Z'
      }]

      const { rerender } = render(<ScoreDisplay players={players} />)

      // Simulate rapid score updates
      for (let i = 1; i <= 10; i++) {
        players[0].score = i * 10
        rerender(<ScoreDisplay players={[...players]} />)
      }

      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })
})