import { render, screen, fireEvent } from '@testing-library/react'
import { AnswerSubmission } from '../AnswerSubmission'
import { Question } from '@/types'

const mockQuestion: Question = {
  id: '1',
  quizId: 'quiz-1',
  text: 'What is the capital of France?',
  options: ['London', 'Berlin', 'Paris', 'Madrid'],
  correctAnswer: 'Paris',
  explanation: 'Paris is the capital and largest city of France.',
  questionOrder: 1
}

describe('AnswerSubmission', () => {
  const mockOnSubmitAnswer = vi.fn()

  beforeEach(() => {
    mockOnSubmitAnswer.mockClear()
  })

  it('renders question and answer options', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
      />
    )

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('London')).toBeInTheDocument()
    expect(screen.getByText('Berlin')).toBeInTheDocument()
    expect(screen.getByText('Paris')).toBeInTheDocument()
    expect(screen.getByText('Madrid')).toBeInTheDocument()
  })

  it('allows selecting an answer', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
      />
    )

    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    expect(parisOption.closest('button')).toHaveClass('bg-primary')
  })

  it('enables submit button when answer is selected', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
      />
    )

    const submitButton = screen.getByText('Submit Answer')
    expect(submitButton).toBeDisabled()

    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmitAnswer when submit button is clicked', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
      />
    )

    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    const submitButton = screen.getByText('Submit Answer')
    fireEvent.click(submitButton)

    expect(mockOnSubmitAnswer).toHaveBeenCalledWith('Paris')
  })

  it('shows submitted state after submission', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        submitted={true}
      />
    )

    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('Answer submitted! Waiting for other players...')).toBeInTheDocument()
  })

  it('displays time remaining', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={15}
      />
    )

    expect(screen.getByText('15s')).toBeInTheDocument()
  })

  it('shows players answered count', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        playersAnswered={2}
        totalPlayers={4}
      />
    )

    expect(screen.getByText('2 of 4 players answered')).toBeInTheDocument()
  })

  it('disables interaction when disabled prop is true', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        disabled={true}
      />
    )

    const parisOption = screen.getByText('Paris')
    fireEvent.click(parisOption)

    expect(parisOption.closest('button')).not.toHaveClass('bg-primary')
  })

  it('shows warning color for low time remaining', () => {
    render(
      <AnswerSubmission
        question={mockQuestion}
        onSubmitAnswer={mockOnSubmitAnswer}
        timeRemaining={5}
      />
    )

    const timeDisplay = screen.getByText('5s')
    expect(timeDisplay).toHaveClass('text-red-500')
  })
})