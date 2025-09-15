import { render, screen } from '@testing-library/react'
import { SessionCreator } from '../SessionCreator'
import { PlayerJoin } from '../PlayerJoin'
import { SessionLobby } from '../SessionLobby'
import type { Quiz, Session, Player } from '@/types'

// Mock fetch
global.fetch = vi.fn()

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

const mockSession: Session = {
  id: 'session-123',
  quizId: 'quiz-1',
  hostId: 'host-1',
  joinCode: 'ABC123',
  status: 'waiting',
  createdAt: '2024-01-01T00:00:00Z',
}

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    sessionId: 'session-123',
    nickname: 'Alice',
    score: 0,
    joinedAt: '2024-01-01T00:01:00Z',
  },
]

describe('Session Management Integration', () => {
  it('renders SessionCreator component', () => {
    render(<SessionCreator quiz={mockQuiz} onSessionCreated={() => {}} />)
    
    expect(screen.getByText('Create Game Session')).toBeInTheDocument()
    expect(screen.getByText('Test Quiz')).toBeInTheDocument()
  })

  it('renders PlayerJoin component', () => {
    render(<PlayerJoin onPlayerJoined={() => {}} />)
    
    expect(screen.getByText('Join Quiz Session')).toBeInTheDocument()
    expect(screen.getByLabelText(/join code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your nickname/i)).toBeInTheDocument()
  })

  it('renders SessionLobby component', () => {
    render(
      <SessionLobby
        session={mockSession}
        quiz={mockQuiz}
        players={mockPlayers}
        isHost={false}
      />
    )
    
    expect(screen.getByText('Test Quiz')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ABC123')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })
})