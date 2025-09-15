import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Home from '../page'
import JoinPage from '../join/page'
import RulesPage from '../rules/page'
import { vi } from 'zod/v4/locales'
import { vi } from 'zod/v4/locales'
import { vi } from 'zod/v4/locales'
import { vi } from 'zod/v4/locales'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Helper function to simulate different viewport sizes
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('Responsive Design', () => {
  beforeEach(() => {
    // Reset to desktop size before each test
    setViewport(1024, 768)
  })

  afterEach(() => {
    // Clean up after each test
    setViewport(1024, 768)
  })

  describe('Homepage Responsive Behavior', () => {
    it('renders responsive navigation on mobile', () => {
      setViewport(375, 667) // iPhone SE size
      render(<Home />)
      
      // Check that mobile-specific text is present
      const createButtons = screen.getAllByText('Create')
      const joinButtons = screen.getAllByText('Join')
      
      // Should have shortened text on mobile
      expect(createButtons.length).toBeGreaterThan(0)
      expect(joinButtons.length).toBeGreaterThan(0)
    })

    it('displays full navigation text on desktop', () => {
      setViewport(1200, 800) // Desktop size
      render(<Home />)
      
      // Check that full text is present
      expect(screen.getByText('Create Quiz')).toBeInTheDocument()
      expect(screen.getByText('Join Game')).toBeInTheDocument()
    })

    it('adapts hero section layout for mobile', () => {
      render(<Home />)
      
      // Check for responsive classes in hero section
      const heroTitle = screen.getByText(/turn any content into/i)
      expect(heroTitle).toBeInTheDocument()
      
      // The component should have responsive text sizing classes
      expect(heroTitle.closest('h2')).toHaveClass('text-3xl', 'sm:text-4xl', 'lg:text-5xl')
    })

    it('stacks CTA buttons vertically on mobile', () => {
      render(<Home />)
      
      // Check for responsive flex classes
      const ctaContainer = screen.getByText(/create quiz now/i).closest('div')?.parentElement
      expect(ctaContainer).toHaveClass('flex-col', 'sm:flex-row')
    })

    it('adapts features grid for different screen sizes', () => {
      render(<Home />)
      
      // Features should be in a responsive grid
      const featuresSection = screen.getByText(/wikipedia integration/i).closest('div')
      while (featuresSection && !featuresSection.classList.contains('grid')) {
        const parent = featuresSection.parentElement
        if (!parent) break
        featuresSection = parent as HTMLElement
      }
      
      expect(featuresSection).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3')
    })

    it('adjusts footer layout for mobile', () => {
      render(<Home />)
      
      // Footer should stack on mobile
      const footer = screen.getByText(/© 2024 TrivParty/i).closest('footer')
      const footerContent = footer?.querySelector('div')
      expect(footerContent).toHaveClass('flex-col', 'sm:flex-row')
    })
  })

  describe('Join Page Responsive Behavior', () => {
    it('adapts join form layout for mobile', () => {
      render(<JoinPage />)
      
      // Main content should be in responsive grid
      const mainContent = screen.getByText(/join a quiz game/i).closest('main')
      const gridContainer = mainContent?.querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
    })

    it('shows responsive navigation on mobile', () => {
      setViewport(375, 667)
      render(<JoinPage />)
      
      // Should show shortened "Back" text on mobile
      expect(screen.getByText('Back')).toBeInTheDocument()
    })

    it('adapts game rules cards for mobile', () => {
      render(<JoinPage />)
      
      // Rules section should be responsive
      const rulesCard = screen.getByText(/how to play/i).closest('.card')
      expect(rulesCard).toBeInTheDocument()
    })
  })

  describe('Rules Page Responsive Behavior', () => {
    it('adapts content layout for mobile', () => {
      render(<RulesPage />)
      
      // Quick start guide should be responsive
      const quickStartGrid = screen.getByText(/to host a game/i).closest('.grid')
      expect(quickStartGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2')
    })

    it('stacks detailed rules cards on mobile', () => {
      render(<RulesPage />)
      
      // Detailed rules should be in responsive grid
      const detailedRulesGrid = screen.getByText(/content sources/i).closest('.grid')
      expect(detailedRulesGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
    })

    it('adapts scoring system layout', () => {
      render(<RulesPage />)
      
      // Scoring system should be responsive
      const scoringGrid = screen.getByText(/correct answer/i).closest('.grid')
      expect(scoringGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })

    it('shows responsive CTA buttons', () => {
      render(<RulesPage />)
      
      // CTA buttons should stack on mobile
      const ctaContainer = screen.getByText(/create quiz/i).closest('.flex')
      expect(ctaContainer).toHaveClass('flex-col', 'sm:flex-row')
    })
  })

  describe('Cross-page Responsive Consistency', () => {
    it('maintains consistent header layout across pages', () => {
      const pages = [
        { component: <Home />, name: 'Home' },
        { component: <JoinPage />, name: 'Join' },
        { component: <RulesPage />, name: 'Rules' }
      ]

      pages.forEach(({ component, name }) => {
        const { rerender } = render(component)
        
        // All pages should have responsive header
        const header = screen.getByRole('banner') || screen.getByText('TrivParty').closest('header')
        expect(header).toBeInTheDocument()
        
        // Header should have responsive navigation
        const nav = header?.querySelector('nav')
        expect(nav).toHaveClass('flex', 'items-center', 'justify-between')
        
        rerender(<div />)
      })
    })

    it('uses consistent responsive breakpoints', () => {
      // Test that all pages use consistent Tailwind breakpoints
      const pages = [<Home />, <JoinPage />, <RulesPage />]
      
      pages.forEach(page => {
        const { container, rerender } = render(page)
        
        // Check for consistent use of sm:, md:, lg: breakpoints
        const elementsWithResponsiveClasses = container.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]')
        expect(elementsWithResponsiveClasses.length).toBeGreaterThan(0)
        
        rerender(<div />)
      })
    })

    it('maintains readable text sizes across devices', () => {
      const pages = [<Home />, <JoinPage />, <RulesPage />]
      
      pages.forEach(page => {
        const { rerender } = render(page)
        
        // Check for responsive text sizing
        const headings = screen.getAllByRole('heading')
        headings.forEach(heading => {
          const classes = heading.className
          // Should have base size and responsive variants
          expect(classes).toMatch(/(text-\w+).*?(sm:text-\w+|md:text-\w+|lg:text-\w+)/)
        })
        
        rerender(<div />)
      })
    })
  })

  describe('Mobile-specific Features', () => {
    it('ensures touch-friendly button sizes', () => {
      setViewport(375, 667)
      render(<Home />)
      
      // Buttons should have adequate touch targets
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      const allElements = buttons.concat(links)
      allElements.forEach(element => {
        const classes = element.className
        // Should have size classes for touch targets
        expect(classes).toMatch(/(size-|px-|py-|p-|h-|w-)/)
      })
    })

    it('provides appropriate spacing on mobile', () => {
      setViewport(375, 667)
      render(<JoinPage />)
      
      // Container should have mobile-appropriate padding
      const main = screen.getByRole('main')
      expect(main).toHaveClass('px-4', 'py-8')
    })
  })
})