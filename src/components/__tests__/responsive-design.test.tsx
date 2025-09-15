import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '@/app/page'
import { QuestionDisplay } from '@/components/QuestionDisplay'
import { AnswerSubmission } from '@/components/AnswerSubmission'
import { ScoreDisplay } from '@/components/ScoreDisplay'
import { Leaderboard } from '@/components/ui/Leaderboard'
import { vi } from 'zod/v4/locales'
import { vi } from 'zod/v4/locales'
import { vi } from 'zod/v4/locales'
import { vi } from 'zod/v4/locales'

// Mock data for testing
const mockQuestion = {
  id: '1',
  text: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 'Paris',
  explanation: 'Paris is the capital and most populous city of France.'
}

const mockPlayers = [
  { id: '1', nickname: 'Player1', score: 100, joinedAt: '2024-01-01T10:00:00Z' },
  { id: '2', nickname: 'Player2', score: 80, joinedAt: '2024-01-01T10:01:00Z' },
  { id: '3', nickname: 'Player3', score: 60, joinedAt: '2024-01-01T10:02:00Z' }
]

describe('Responsive Design Tests', () => {
  describe('Homepage Responsive Design', () => {
    it('renders homepage with responsive classes', () => {
      render(<Home />)
      
      // Check for responsive text sizing
      const mainHeading = screen.getByText(/Turn Any Content Into/)
      expect(mainHeading).toHaveClass('text-3xl', 'sm:text-4xl', 'lg:text-5xl')
      
      // Check for responsive button layout
      const createButton = screen.getByRole('link', { name: /Create Quiz Now/ })
      expect(createButton.parentElement).toHaveClass('flex', 'flex-col', 'sm:flex-row')
    })

    it('has proper responsive grid for features', () => {
      render(<Home />)
      
      // Features grid should be responsive
      const featuresGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3')
      expect(featuresGrid).toBeInTheDocument()
    })
  })

  describe('QuestionDisplay Responsive Design', () => {
    it('renders with mobile-optimized touch targets', () => {
      const mockOnAnswerSelect = vi.fn()
      
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswerSelect={mockOnAnswerSelect}
        />
      )
      
      // Check for touch-optimized button classes
      const answerButtons = screen.getAllByRole('button')
      answerButtons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation')
        expect(button).toHaveClass('active:scale-[0.98]')
      })
    })

    it('has responsive padding and text sizes', () => {
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
        />
      )
      
      // Check for responsive padding
      const cardContent = document.querySelector('[class*="pt-0"]')
      expect(cardContent).toBeInTheDocument()
      
      // Check for responsive text sizing in options
      const optionText = screen.getByText('London').parentElement
      expect(optionText?.querySelector('span')).toHaveClass('text-sm', 'sm:text-base')
    })
  })

  describe('AnswerSubmission Responsive Design', () => {
    it('renders with mobile-optimized layout', () => {
      const mockOnSubmit = vi.fn()
      
      render(
        <AnswerSubmission
          question={mockQuestion}
          onSubmitAnswer={mockOnSubmit}
          timeRemaining={30}
          playersAnswered={2}
          totalPlayers={4}
        />
      )
      
      // Check for responsive flex layout
      const submitButton = screen.getByRole('button', { name: /Submit Answer/ })
      expect(submitButton).toHaveClass('w-full', 'sm:w-auto')
    })
  })

  describe('ScoreDisplay Responsive Design', () => {
    it('renders compact mode for mobile', () => {
      render(
        <ScoreDisplay
          players={mockPlayers}
          currentPlayerId="1"
          compact={true}
        />
      )
      
      // Check for responsive nickname truncation
      const playerElements = screen.getAllByText(/Player/)
      playerElements.forEach(element => {
        const truncateElement = element.closest('[class*="truncate"]')
        expect(truncateElement).toHaveClass('max-w-16', 'sm:max-w-20')
      })
    })

    it('renders full mode with responsive text', () => {
      render(
        <ScoreDisplay
          players={mockPlayers}
          currentPlayerId="1"
          compact={false}
        />
      )
      
      // Check for responsive heading
      const heading = screen.getByText('Current Scores')
      expect(heading).toHaveClass('text-base', 'sm:text-lg')
    })
  })

  describe('Leaderboard Responsive Design', () => {
    it('renders with mobile-optimized player cards', () => {
      render(
        <Leaderboard
          players={mockPlayers}
          currentPlayerId="1"
        />
      )
      
      // Check for responsive title
      const title = screen.getByText('Leaderboard')
      expect(title).toHaveClass('text-lg', 'sm:text-2xl')
      
      // Check for responsive score display
      const scoreElements = document.querySelectorAll('[class*="text-xl"][class*="sm:text-2xl"]')
      expect(scoreElements.length).toBeGreaterThan(0)
    })

    it('has responsive badge text for rankings', () => {
      render(
        <Leaderboard
          players={mockPlayers}
          currentPlayerId="1"
        />
      )
      
      // Check for responsive badge content (should show "1st" on mobile, "1st Place" on desktop)
      const badges = document.querySelectorAll('.hidden.sm\\:inline, .sm\\:hidden')
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  describe('Touch Interaction Optimizations', () => {
    it('applies touch-manipulation class to interactive elements', () => {
      const mockOnSubmit = vi.fn()
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswerSelect={mockOnSubmit}
        />
      )
      
      // Check answer option buttons for touch-manipulation
      const answerButtons = screen.getAllByRole('button')
      answerButtons.forEach(button => {
        expect(button).toHaveClass('touch-manipulation')
      })
    })

    it('uses active states instead of hover on touch devices', () => {
      render(
        <QuestionDisplay
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswerSelect={vi.fn()}
        />
      )
      
      const answerButtons = screen.getAllByRole('button')
      answerButtons.forEach(button => {
        // Should have active scale instead of hover scale
        expect(button).toHaveClass('active:scale-[0.98]')
      })
    })
  })

  describe('Viewport and Layout Tests', () => {
    it('uses proper responsive containers', () => {
      render(<Home />)
      
      // Check for responsive container classes
      const containers = document.querySelectorAll('.container')
      containers.forEach(container => {
        expect(container).toHaveClass('mx-auto', 'px-4')
      })
    })

    it('has responsive spacing classes', () => {
      render(<Home />)
      
      // Check for responsive padding/margin classes
      const responsiveElements = document.querySelectorAll('[class*="sm:py-"], [class*="sm:px-"], [class*="sm:mb-"]')
      expect(responsiveElements.length).toBeGreaterThan(0)
    })
  })
})