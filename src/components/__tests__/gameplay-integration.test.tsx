import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionDisplay } from '../QuestionDisplay'
import { AnswerSubmission } from '../AnswerSubmission'
import { GameController } from '../GameController'
import { Question, Player } from '@/types'

const mockQuestion: Question = {
  id: '1',
  quizId: 'quiz-1',
  text: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 'Paris',
  explanation: 'Paris is the capital and largest city of France.',
  questionOrder: 1
}

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    sessionId: 'session-1',
    nickname: 'Alice',
    score: 0,
    joinedAt: '2024-01-01T00:00:00Z'
  }
]

describe('Gameplay Components Integration', () => {
  it('QuestionDisplay shows question in results mode', () => {
    render(
      <QuestionDisplay
        question={mockQuestion}
        questionNumber={1}
        totalQuestions={5}
        showResults={true}
        correctAnswer="Paris"
        selectedAnswer="London"
      />
    )

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(screen.getByText('Explanation')).toBeInTheDocument()
    expect(screen.getByText('Paris is the capital and largest city of France.')).toBeInTheDocument()
  })

  it('AnswerSubmission allows selecting and submitting answers', () => {
    const mockOnSubmit = vi.fn()
    
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmit}
        timeRemaining={20}
        playersAnswered={0}
        totalPlayers={2}
      />
    )

    // Select an answer
    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    // Submit the answer
    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('Paris')
  })

  it('GameController manages complete game flow', () => {
    const mockOnAnswerSubmit = vi.fn()
    
    render(
      <GameController
        questions={[mockQuestion]}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={mockOnAnswerSubmit}
      />
    )

    // Should show the question
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    
    // Should show progress
    expect(screen.getByText('Question 1 of 1')).toBeInTheDocument()
    expect(screen.getByText('0% Complete')).toBeInTheDocument()
    
    // Should show timer
    expect(screen.getByText('30s')).toBeInTheDocument()
    
    // Should allow answer submission
    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)
    
    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)
    
    expect(mockOnAnswerSubmit).toHaveBeenCalledWith('1', 'Paris')
  })

  it('GameController shows submitted state after answer submission', () => {
    // Use multiple players so the game doesn't auto-advance to results
    const multiplePlayers = [
      ...mockPlayers,
      {
        id: 'player-2',
        sessionId: 'session-1',
        nickname: 'Bob',
        score: 0,
        joinedAt: '2024-01-01T00:00:00Z'
      }
    ]

    render(
      <GameController
        questions={[mockQuestion]}
        players={multiplePlayers}
        playerId="player-1"
        onAnswerSubmit={vi.fn()}
      />
    )

    // Submit an answer
    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)
    
    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)
    
    // Should show submitted state
    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Answer submitted! Waiting for other players...')).toBeInTheDocument()
  })

  it('GameController handles empty questions gracefully', () => {
    render(
      <GameController
        questions={[]}
        players={mockPlayers}
        playerId="player-1"
        onAnswerSubmit={vi.fn()}
      />
    )

    expect(screen.getByText('No questions available')).toBeInTheDocument()
  })
})