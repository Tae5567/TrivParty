import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Home from '../page'
import JoinPage from '../join/page'
import RulesPage from '../rules/page'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

describe('Navigation Flow', () => {
  describe('Homepage Navigation', () => {
    it('renders main navigation links in header', () => {
      render(<Home />)
      
      // Check for main navigation links - there are multiple create quiz links
      expect(screen.getAllByRole('link', { name: /create quiz/i })).toHaveLength(3) // Header, hero, footer
      expect(screen.getAllByRole('link', { name: /join game/i })).toHaveLength(3) // Header, hero, footer
    })

    it('renders hero section call-to-action buttons', () => {
      render(<Home />)
      
      // Check for hero CTA buttons
      expect(screen.getByRole('link', { name: /create quiz now/i })).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: /join game/i })).toHaveLength(3) // Multiple join game links
    })

    it('renders footer navigation links', () => {
      render(<Home />)
      
      // Check for footer links
      expect(screen.getByRole('link', { name: /game rules/i })).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: /create quiz/i })).toHaveLength(3) // Multiple create quiz links
      expect(screen.getAllByRole('link', { name: /join game/i })).toHaveLength(3) // Multiple join game links
    })

    it('displays TrivParty branding', () => {
      render(<Home />)
      
      expect(screen.getByText('TrivParty')).toBeInTheDocument()
    })

    it('shows main value proposition', () => {
      render(<Home />)
      
      expect(screen.getAllByText(/turn any content into/i)).toHaveLength(2) // Hero and footer
      expect(screen.getAllByText(/interactive trivia/i)).toHaveLength(2) // Hero and footer
    })
  })

  describe('Join Page Navigation', () => {
    it('renders header with back navigation', () => {
      render(<JoinPage />)
      
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
      expect(screen.getByText('TrivParty')).toBeInTheDocument()
    })

    it('displays join game form', () => {
      render(<JoinPage />)
      
      expect(screen.getByText(/join a quiz game/i)).toBeInTheDocument()
      expect(screen.getByText(/enter your join code and nickname/i)).toBeInTheDocument()
    })

    it('shows game rules section', () => {
      render(<JoinPage />)
      
      expect(screen.getByText(/how to play/i)).toBeInTheDocument()
      expect(screen.getByText(/join the session/i)).toBeInTheDocument()
    })

    it('provides link to create quiz for users without join code', () => {
      render(<JoinPage />)
      
      expect(screen.getByRole('link', { name: /create your own quiz/i })).toBeInTheDocument()
    })
  })

  describe('Rules Page Navigation', () => {
    it('renders header with navigation', () => {
      render(<RulesPage />)
      
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument()
      expect(screen.getAllByRole('link', { name: /join game/i })).toHaveLength(2) // Header and CTA
      expect(screen.getByText('TrivParty')).toBeInTheDocument()
    })

    it('displays comprehensive game rules', () => {
      render(<RulesPage />)
      
      expect(screen.getByText(/game rules & instructions/i)).toBeInTheDocument()
      expect(screen.getByText(/quick start guide/i)).toBeInTheDocument()
    })

    it('shows content sources information', () => {
      render(<RulesPage />)
      
      expect(screen.getByText(/content sources/i)).toBeInTheDocument()
      expect(screen.getByText(/wikipedia articles/i)).toBeInTheDocument()
      expect(screen.getAllByText(/youtube videos/i)).toHaveLength(2) // Heading and description
    })

    it('explains scoring system', () => {
      render(<RulesPage />)
      
      expect(screen.getByText(/scoring system/i)).toBeInTheDocument()
      expect(screen.getAllByText(/correct answer/i)).toHaveLength(5) // Multiple mentions throughout page
      expect(screen.getByText(/speed bonus/i)).toBeInTheDocument()
    })

    it('provides call-to-action buttons', () => {
      render(<RulesPage />)
      
      expect(screen.getAllByRole('link', { name: /create quiz/i })).toHaveLength(1)
      expect(screen.getAllByRole('link', { name: /join game/i })).toHaveLength(2) // Header and CTA
    })
  })

  describe('Cross-page Navigation Consistency', () => {
    it('maintains consistent branding across pages', () => {
      const { rerender } = render(<Home />)
      expect(screen.getByText('TrivParty')).toBeInTheDocument()
      
      rerender(<JoinPage />)
      expect(screen.getByText('TrivParty')).toBeInTheDocument()
      
      rerender(<RulesPage />)
      expect(screen.getByText('TrivParty')).toBeInTheDocument()
    })

    it('provides consistent navigation patterns', () => {
      // JoinPage should have join game functionality but not navigation link
      const { rerender } = render(<JoinPage />)
      expect(screen.getByText(/join a quiz game/i)).toBeInTheDocument()
      rerender(<div />)
      
      // RulesPage should have join game links
      rerender(<RulesPage />)
      expect(screen.getAllByRole('link', { name: /join game/i })).toHaveLength(2)
      rerender(<div />)
    })
  })
})