import { render, screen, fireEvent } from '@testing-library/react'
import { GameController } from '../GameController'
import { Question, Player } from '@/types'

const mockQuestions: Question[] = [
  {
    id: '1',
    quizId: 'quiz-1',
    text: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswer: 'Paris',
    explanation: 'Paris is the capital and largest city of France.',
    questionOrder: 1
  },
  {
    id: '2',
    quizId: 'quiz-1',
    text: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    explanation: 'Basic arithmetic: 2 + 2 = 4.',
    questionOrder: 2
  }
]

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    sessionId: 'session-1',
    nickname: 'Alice',
    score: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'player-2',
    sessionId: 'session-1',
    nickname: 'Bob',
    score: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  }
]

describe('GameController', () => {
  const mockOnAnswerSubmit = vi.fn()
  const mockOnNextQuestion = vi.fn()
  const mockOnGameComplete = vi.fn()
  const mockOnRestartGame = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders first question initially', () => {
    render(
      <GameController
        questions={mockQuestions}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('shows progress bar with correct percentage', () => {
    render(
      <GameController
        questions={mockQuestions}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    expect(screen.getByText('0% Complete')).toBeInTheDocument()
  })

  it('allows player to submit answer', () => {
    render(
      <GameController
        questions={mockQuestions}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    expect(mockOnAnswerSubmit).toHaveBeenCalledWith('1', 'Paris')
  })

  it('displays initial question state correctly', () => {
    render(
      <GameController
        questions={mockQuestions}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('30s')).toBeInTheDocument() // Initial timer
  })

  it('shows correct progress for multi-question quiz', () => {
    render(
      <GameController
        questions={mockQuestions}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    expect(screen.getByText('0% Complete')).toBeInTheDocument()
  })

  it('handles single question quiz correctly', () => {
    render(
      <GameController
        questions={[mockQuestions[0]]}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    expect(screen.getByText('Question 1 of 1')).toBeInTheDocument()
  })

  it('handles empty questions array', () => {
    render(
      <GameController
        questions={[]}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    expect(screen.getByText('No questions available')).toBeInTheDocument()
  })
})