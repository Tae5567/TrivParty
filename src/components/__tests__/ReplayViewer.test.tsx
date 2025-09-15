import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReplayViewer } from '../ReplayViewer'
import { GameReplay } from '@/types/replay'

const mockReplay: GameReplay = {
  id: 'replay-123',
  sessionId: 'session-123',
  replayCode: 'ABC12345',
  title: 'Test Quiz Replay',
  quizTitle: 'Test Quiz',
  totalQuestions: 2,
  totalPlayers: 3,
  sessionDurationSeconds: 300,
  finalScores: [
    { playerId: 'player-1', nickname: 'Alice', score: 200, rank: 1 },
    { playerId: 'player-2', nickname: 'Bob', score: 150, rank: 2 },
    { playerId: 'player-3', nickname: 'Charlie', score: 100, rank: 3 }
  ],
  questionResults: [
    {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      explanation: 'Basic addition',
      questionOrder: 1,
      playerAnswers: [
        { playerId: 'player-1', nickname: 'Alice', selectedAnswer: '4', isCorrect: true, answeredAt: '2023-01-01T00:01:00Z' },
        { playerId: 'player-2', nickname: 'Bob', selectedAnswer: '3', isCorrect: false, answeredAt: '2023-01-01T00:01:05Z' },
        { playerId: 'player-3', nickname: 'Charlie', selectedAnswer: '4', isCorrect: true, answeredAt: '2023-01-01T00:01:10Z' }
      ]
    },
    {
      questionId: 'q2',
      questionText: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital of France',
      questionOrder: 2,
      playerAnswers: [
        { playerId: 'player-1', nickname: 'Alice', selectedAnswer: 'Paris', isCorrect: true, answeredAt: '2023-01-01T00:02:00Z' },
        { playerId: 'player-2', nickname: 'Bob', selectedAnswer: 'London', isCorrect: false, answeredAt: '2023-01-01T00:02:05Z' },
        { playerId: 'player-3', nickname: 'Charlie', selectedAnswer: 'Berlin', isCorrect: false, answeredAt: '2023-01-01T00:02:10Z' }
      ]
    }
  ],
  createdAt: '2023-01-01T00:00:00Z',
  expiresAt: '2023-02-01T00:00:00Z',
  isPublic: true,
  viewCount: 5
}

describe('ReplayViewer', () => {
  it('should render overview mode by default', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    expect(screen.getByText('Final Results')).toBeInTheDocument()
    expect(screen.getByText('Final Leaderboard')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('should display correct player rankings', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    const rankings = screen.getAllByText(/^\d+$/)
    expect(rankings[0]).toHaveTextContent('1')
    expect(rankings[1]).toHaveTextContent('2')
    expect(rankings[2]).toHaveTextContent('3')
  })

  it('should display quiz statistics', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    expect(screen.getByText('3')).toBeInTheDocument() // Total players
    expect(screen.getByText('2')).toBeInTheDocument() // Total questions
    expect(screen.getByText('5m')).toBeInTheDocument() // Duration
  })

  it('should switch to questions mode', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
  })

  it('should navigate between questions', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    // Switch to questions mode
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    // Should show first question
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
    
    // Navigate to next question
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument()
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument()
    
    // Navigate back
    const prevButton = screen.getByText('Previous')
    fireEvent.click(prevButton)
    
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
  })

  it('should display answer distribution correctly', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    // Switch to questions mode
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    expect(screen.getByText('Answer Distribution')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument() // Correct answer
    expect(screen.getByText('Correct')).toBeInTheDocument()
  })

  it('should display player responses', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    // Switch to questions mode
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    expect(screen.getByText('Player Responses')).toBeInTheDocument()
    
    // Should show all player responses for the question
    const aliceResponse = screen.getByText('Alice')
    const bobResponse = screen.getByText('Bob')
    const charlieResponse = screen.getByText('Charlie')
    
    expect(aliceResponse).toBeInTheDocument()
    expect(bobResponse).toBeInTheDocument()
    expect(charlieResponse).toBeInTheDocument()
  })

  it('should display question explanation', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    // Switch to questions mode
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    expect(screen.getByText('Explanation')).toBeInTheDocument()
    expect(screen.getByText('Basic addition')).toBeInTheDocument()
  })

  it('should disable navigation buttons at boundaries', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    // Switch to questions mode
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    // At first question, previous should be disabled
    const prevButton = screen.getByText('Previous')
    expect(prevButton).toBeDisabled()
    
    // Navigate to last question
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    // At last question, next should be disabled
    expect(nextButton).toBeDisabled()
  })

  it('should calculate answer statistics correctly', () => {
    render(<ReplayViewer replay={mockReplay} />)
    
    // Switch to questions mode
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    // For first question (2 out of 3 correct = 67%)
    expect(screen.getByText('67% correct')).toBeInTheDocument()
    expect(screen.getByText('3 responses')).toBeInTheDocument()
  })
})