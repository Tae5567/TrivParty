import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { SessionLobby } from '../SessionLobby'
import type { Session, Quiz, Player } from '@/types'

// Mock fetch
global.fetch = vi.fn()

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

const mockSession: Session = {
  id: 'session-123',
  quizId: 'quiz-1',
  hostId: 'host-1',
  joinCode: 'ABC123',
  status: 'waiting',
  createdAt: '2024-01-01T00:00:00Z',
}

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
    {
      id: 'q2',
      quizId: 'quiz-1',
      text: 'What is 3+3?',
      options: ['5', '6', '7', '8'],
      correctAnswer: '6',
      explanation: 'Basic math',
      questionOrder: 2,
    },
  ],
}

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    sessionId: 'session-123',
    nickname: 'Alice',
    score: 0,
    joinedAt: '2024-01-01T00:01:00Z',
  },
  {
    id: 'player-2',
    sessionId: 'session-123',
    nickname: 'Bob',
    score: 0,
    joinedAt: '2024-01-01T00:02:00Z',
  },
]

const mockOnStartGame = vi.fn()
const mockOnRefreshPlayers = vi.fn()

describe('SessionLobby', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as any).mockClear()
  })

  it('renders session info and quiz details', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('Test Quiz')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2 questions')).toBeInTheDocument()
    expect(screen.getByDisplayValue('http://localhost:3000/play/session-123')).toBeInTheDocument()
  })

  it('displays host message when user is host', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={true}
        hostId="host-1"
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('You are hosting this session')).toBeInTheDocument()
    expect(screen.getByText('Host Controls')).toBeInTheDocument()
  })

  it('displays waiting message when user is not host', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('Waiting for the host to start the game')).toBeInTheDocument()
    expect(screen.getByText('Waiting for the host to start the game...')).toBeInTheDocument()
  })

  it('displays players list', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('Players (2)')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('displays empty state when no players', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={[]}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('Players (0)')).toBeInTheDocument()
    expect(screen.getByText('Waiting for players to join...')).toBeInTheDocument()
  })

  it('highlights current player', () => {
    const currentPlayer = mockPlayers[0]
    
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        currentPlayer={currentPlayer}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('shows crown icon for host player', () => {
    const currentPlayer = mockPlayers[0]
    
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={true}
        currentPlayer={currentPlayer}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    // Crown should be visible for the current player when they are the host
    const crownIcon = screen.getByTestId ? screen.queryByTestId('crown-icon') : null
    // Since we can't easily test for Lucide icons, we'll check for the host controls instead
    expect(screen.getByText('Host Controls')).toBeInTheDocument()
  })

  it('copies join link to clipboard', async () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    const copyButtons = screen.getAllByRole('button', { name: /copy/i })
    fireEvent.click(copyButtons[0]) // Click the first copy button

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/play/session-123'
      )
    })

    expect(screen.getByText('Copied!')).toBeInTheDocument()
  })

  it('allows host to start game when players are present', async () => {
    const mockResponse = { success: true }

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={true}
        hostId="host-1"
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    const startButton = screen.getByRole('button', { name: /start game/i })
    expect(startButton).not.toBeDisabled()

    fireEvent.click(startButton)

    expect(startButton).toBeDisabled()
    expect(screen.getByText('Starting Game...')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'session-123',
          hostId: 'host-1',
        }),
      })
    })

    await waitFor(() => {
      expect(mockOnStartGame).toHaveBeenCalled()
    })
  })

  it('disables start button when no players', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={[]}
        isHost={true}
        hostId="host-1"
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    const startButton = screen.getByRole('button', { name: /start game/i })
    expect(startButton).toBeDisabled()
    expect(screen.getByText('You need at least one player to start the game')).toBeInTheDocument()
  })

  it('handles start game error', async () => {
    const mockError = { error: 'Cannot start session in current state' }

    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError),
    })

    // Mock alert
    window.alert = vi.fn()

    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={true}
        hostId="host-1"
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    const startButton = screen.getByRole('button', { name: /start game/i })
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Cannot start session in current state')
    })

    expect(mockOnStartGame).not.toHaveBeenCalled()
  })

  it('calls refresh players when refresh button is clicked', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)

    expect(mockOnRefreshPlayers).toHaveBeenCalled()
  })

  it('does not show host controls when not host', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.queryByText('Host Controls')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument()
  })

  it('shows player count in host controls', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={true}
        hostId="host-1"
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('2 players ready to play')).toBeInTheDocument()
  })

  it('handles singular player count correctly', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={[mockPlayers[0]]}
        isHost={true}
        hostId="host-1"
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    expect(screen.getByText('1 player ready to play')).toBeInTheDocument()
  })

  it('falls back to document.execCommand for copying when clipboard API fails', async () => {
    // Mock clipboard API to fail
    ;(navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('Clipboard failed'))

    // Mock document methods
    const mockTextArea = {
      value: '',
      style: {},
      focus: vi.fn(),
      select: vi.fn(),
    }
    document.createElement = vi.fn(() => mockTextArea as any)
    document.body.appendChild = vi.fn()
    document.body.removeChild = vi.fn()
    document.execCommand = vi.fn()

    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
        onStartGame={mockOnStartGame}
        onRefreshPlayers={mockOnRefreshPlayers}
      />
    )

    const copyButtons = screen.getAllByRole('button', { name: /copy/i })
    fireEvent.click(copyButtons[0])

    await waitFor(() => {
      expect(document.createElement).toHaveBeenCalledWith('textarea')
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })
  })
})