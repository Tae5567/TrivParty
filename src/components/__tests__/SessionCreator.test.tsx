import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SessionCreator } from '../SessionCreator'
import type { Quiz } from '@/types'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock fetch
global.fetch = vi.fn()

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-host-id'),
  },
})

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
})

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
})

const mockQuiz: Quiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  sourceUrl: 'https://example.com',
  createdAt: '2024-01-01T00:00:00Z',
  questions: [
    {
      id: 'q1',
      quizId: 'quiz-1',
      text: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'Basic math',
      questionOrder: 1,
    },
  ],
}

const mockOnSessionCreated = vi.fn()

describe('SessionCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
      ; (fetch as any).mockClear()
  })

  it('renders quiz details and create button', () => {
    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    expect(screen.getByText('Create Game Session')).toBeInTheDocument()
    expect(screen.getByText('Test Quiz')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // question count
    expect(screen.getByRole('button', { name: /create session/i })).toBeInTheDocument()
  })

  it('creates session successfully', async () => {
    const mockResponse = {
      sessionId: 'session-123',
      joinCode: 'ABC123',
    }

      ; (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    const createButton = screen.getByRole('button', { name: /create session/i })
    fireEvent.click(createButton)

    expect(createButton).toBeDisabled()
    expect(screen.getByText('Creating Session...')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: 'quiz-1',
          hostId: 'mock-host-id',
        }),
      })
    })

    await waitFor(() => {
      expect(mockOnSessionCreated).toHaveBeenCalledWith({
        ...mockResponse,
        quiz: mockQuiz,
      })
    })
  })

  it('displays session details after creation', async () => {
    const mockResponse = {
      sessionId: 'session-123',
      joinCode: 'ABC123',
    }

      ; (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    fireEvent.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => {
      expect(screen.getByText('Session Created')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('http://localhost:3000/play/session-123')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /copy/i })).toHaveLength(2)
  })

  it('copies join link to clipboard', async () => {
    const mockResponse = {
      sessionId: 'session-123',
      joinCode: 'ABC123',
    }

      ; (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    fireEvent.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => {
      expect(screen.getByText('Session Created')).toBeInTheDocument()
    })

    const copyButtons = screen.getAllByRole('button', { name: /copy/i })
    fireEvent.click(copyButtons[1]) // Click the second copy button (for the link)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/play/session-123'
      )
    })

    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('handles session creation error', async () => {
    const mockError = { error: 'Quiz not found' }

      ; (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(mockError),
      })

    // Mock alert
    window.alert = vi.fn()

    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    fireEvent.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Quiz not found')
    })

    expect(mockOnSessionCreated).not.toHaveBeenCalled()
  })

  it('handles network error', async () => {
    ; (fetch as any).mockRejectedValueOnce(new Error('Network error'))

    // Mock alert
    window.alert = vi.fn()

    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    fireEvent.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Network error')
    })

    expect(mockOnSessionCreated).not.toHaveBeenCalled()
  })

  it('falls back to document.execCommand for copying when clipboard API fails', async () => {
    const mockResponse = {
      sessionId: 'session-123',
      joinCode: 'ABC123',
    }

      ; (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

    render(<SessionCreator quiz={mockQuiz} onSessionCreated={mockOnSessionCreated} />)

    fireEvent.click(screen.getByRole('button', { name: /create session/i }))

    await waitFor(() => {
      expect(screen.getByText('Session Created')).toBeInTheDocument()
    })

      // Mock clipboard API to fail after component is rendered
      ; (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Clipboard failed'))

    // Mock document methods
    const mockTextArea = {
      value: '',
      select: vi.fn(),
    }
    const originalCreateElement = document.createElement
    const originalAppendChild = document.body.appendChild
    const originalRemoveChild = document.body.removeChild
    const originalExecCommand = document.execCommand

    document.createElement = vi.fn(() => mockTextArea as unknown)
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
    document.execCommand = vi.fn()

    const copyButtons = screen.getAllByRole('button', { name: /copy/i })
    fireEvent.click(copyButtons[1])

    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith('textarea')
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })

    // Restore original methods
    document.createElement = originalCreateElement
    document.body.appendChild = originalAppendChild
    document.body.removeChild = originalRemoveChild
    document.execCommand = originalExecCommand
  })
})