import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReplayCreator } from '../ReplayCreator'
import { ReplayViewer } from '../ReplayViewer'
import { GameReplay } from '@/types/replay'

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock clipboard and window APIs
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
})
global.open = vi.fn()
global.alert = vi.fn()

describe('Replay System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create and display a complete replay workflow', async () => {
    const mockSessionData = {
      sessionId: 'session-123',
      title: 'Math Quiz Session',
      quizTitle: 'Basic Math',
      totalQuestions: 3,
      totalPlayers: 2,
      sessionDurationSeconds: 180,
      finalScores: [
        { playerId: 'player-1', nickname: 'Alice', score: 300, rank: 1 },
        { playerId: 'player-2', nickname: 'Bob', score: 200, rank: 2 }
      ],
      questionResults: [
        {
          questionId: 'q1',
          questionText: 'What is 5 + 3?',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          explanation: 'Simple addition: 5 + 3 = 8',
          questionOrder: 1,
          playerAnswers: [
            { playerId: 'player-1', nickname: 'Alice', selectedAnswer: '8', isCorrect: true, answeredAt: '2023-01-01T00:01:00Z' },
            { playerId: 'player-2', nickname: 'Bob', selectedAnswer: '7', isCorrect: false, answeredAt: '2023-01-01T00:01:05Z' }
          ]
        },
        {
          questionId: 'q2',
          questionText: 'What is 10 - 4?',
          options: ['5', '6', '7', '8'],
          correctAnswer: '6',
          explanation: 'Simple subtraction: 10 - 4 = 6',
          questionOrder: 2,
          playerAnswers: [
            { playerId: 'player-1', nickname: 'Alice', selectedAnswer: '6', isCorrect: true, answeredAt: '2023-01-01T00:02:00Z' },
            { playerId: 'player-2', nickname: 'Bob', selectedAnswer: '6', isCorrect: true, answeredAt: '2023-01-01T00:02:05Z' }
          ]
        },
        {
          questionId: 'q3',
          questionText: 'What is 3 × 4?',
          options: ['10', '11', '12', '13'],
          correctAnswer: '12',
          explanation: 'Simple multiplication: 3 × 4 = 12',
          questionOrder: 3,
          playerAnswers: [
            { playerId: 'player-1', nickname: 'Alice', selectedAnswer: '12', isCorrect: true, answeredAt: '2023-01-01T00:03:00Z' },
            { playerId: 'player-2', nickname: 'Bob', selectedAnswer: '11', isCorrect: false, answeredAt: '2023-01-01T00:03:05Z' }
          ]
        }
      ]
    }

    const mockReplay: GameReplay = {
      id: 'replay-123',
      sessionId: 'session-123',
      replayCode: 'MATH2023',
      title: 'Math Quiz Session',
      quizTitle: 'Basic Math',
      totalQuestions: 3,
      totalPlayers: 2,
      sessionDurationSeconds: 180,
      finalScores: mockSessionData.finalScores,
      questionResults: mockSessionData.questionResults,
      createdAt: '2023-01-01T00:00:00Z',
      expiresAt: '2023-02-01T00:00:00Z',
      isPublic: true,
      viewCount: 0
    }

    const mockFetch = vi.mocked(fetch)
    
    // Mock replay creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        replay: {
          id: mockReplay.id,
          replayCode: mockReplay.replayCode,
          title: mockReplay.title,
          shareUrl: `https://example.com/replay/${mockReplay.replayCode}`,
          socialUrls: {
            twitter: 'https://twitter.com/intent/tweet?...',
            facebook: 'https://facebook.com/sharer/...',
            linkedin: 'https://linkedin.com/sharing/...'
          }
        }
      })
    } as Response)

    // Test replay creation
    const { rerender } = render(<ReplayCreator sessionId="session-123" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Replay Created!')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Math Quiz Session')).toBeInTheDocument()
    expect(screen.getByDisplayValue(`https://example.com/replay/${mockReplay.replayCode}`)).toBeInTheDocument()
    
    // Test social sharing
    const twitterButton = screen.getByText('Twitter')
    
    // Mock share recording
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response)
    
    fireEvent.click(twitterButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/replay/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replayId: mockReplay.id,
          platform: 'twitter'
        })
      })
    })
    
    // Test replay viewing
    rerender(<ReplayViewer replay={mockReplay} />)
    
    // Should show overview by default
    expect(screen.getByText('Final Leaderboard')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument() // Alice's score
    expect(screen.getByText('200')).toBeInTheDocument() // Bob's score
    
    // Test question-by-question view
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    expect(screen.getByText('What is 5 + 3?')).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    
    // Test navigation
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)
    
    expect(screen.getByText('What is 10 - 4?')).toBeInTheDocument()
    expect(screen.getByText('Question 2 of 3')).toBeInTheDocument()
    
    // Test answer distribution
    expect(screen.getByText('Answer Distribution')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument() // Correct answer
    expect(screen.getByText('100% correct')).toBeInTheDocument() // Both players got it right
    
    // Test player responses
    expect(screen.getByText('Player Responses')).toBeInTheDocument()
    const aliceResponses = screen.getAllByText('Alice')
    const bobResponses = screen.getAllByText('Bob')
    expect(aliceResponses.length).toBeGreaterThan(0)
    expect(bobResponses.length).toBeGreaterThan(0)
    
    // Test explanation
    expect(screen.getByText('Explanation')).toBeInTheDocument()
    expect(screen.getByText('Simple subtraction: 10 - 4 = 6')).toBeInTheDocument()
    
    // Navigate to last question
    fireEvent.click(nextButton)
    
    expect(screen.getByText('What is 3 × 4?')).toBeInTheDocument()
    expect(screen.getByText('Question 3 of 3')).toBeInTheDocument()
    expect(screen.getByText('50% correct')).toBeInTheDocument() // Only Alice got it right
    
    // Test navigation boundaries
    expect(nextButton).toBeDisabled() // Should be disabled at last question
    
    const prevButton = screen.getByText('Previous')
    fireEvent.click(prevButton)
    fireEvent.click(prevButton) // Go back to first question
    
    expect(screen.getByText('What is 5 + 3?')).toBeInTheDocument()
    expect(prevButton).toBeDisabled() // Should be disabled at first question
  })

  it('should handle replay creation and viewing errors gracefully', async () => {
    const mockFetch = vi.mocked(fetch)
    
    // Mock failed replay creation
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Session not found' })
    } as Response)

    render(<ReplayCreator sessionId="invalid-session" />)
    
    const createButton = screen.getByText('Create Shareable Replay')
    fireEvent.click(createButton)
    
    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument()
    })
    
    // Test that the error is displayed and button is re-enabled
    expect(createButton).not.toBeDisabled()
  })

  it('should calculate and display accurate statistics', () => {
    const mockReplay: GameReplay = {
      id: 'replay-stats',
      sessionId: 'session-stats',
      replayCode: 'STATS123',
      title: 'Statistics Test',
      quizTitle: 'Test Quiz',
      totalQuestions: 2,
      totalPlayers: 4,
      sessionDurationSeconds: 240,
      finalScores: [
        { playerId: 'p1', nickname: 'Player1', score: 200, rank: 1 },
        { playerId: 'p2', nickname: 'Player2', score: 150, rank: 2 },
        { playerId: 'p3', nickname: 'Player3', score: 100, rank: 3 },
        { playerId: 'p4', nickname: 'Player4', score: 50, rank: 4 }
      ],
      questionResults: [
        {
          questionId: 'q1',
          questionText: 'Test Question 1',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'B',
          explanation: 'B is correct',
          questionOrder: 1,
          playerAnswers: [
            { playerId: 'p1', nickname: 'Player1', selectedAnswer: 'B', isCorrect: true, answeredAt: '2023-01-01T00:01:00Z' },
            { playerId: 'p2', nickname: 'Player2', selectedAnswer: 'A', isCorrect: false, answeredAt: '2023-01-01T00:01:05Z' },
            { playerId: 'p3', nickname: 'Player3', selectedAnswer: 'B', isCorrect: true, answeredAt: '2023-01-01T00:01:10Z' },
            { playerId: 'p4', nickname: 'Player4', selectedAnswer: 'C', isCorrect: false, answeredAt: '2023-01-01T00:01:15Z' }
          ]
        }
      ],
      createdAt: '2023-01-01T00:00:00Z',
      expiresAt: '2023-02-01T00:00:00Z',
      isPublic: true,
      viewCount: 10
    }

    render(<ReplayViewer replay={mockReplay} />)
    
    // Test overview statistics
    expect(screen.getByText('4')).toBeInTheDocument() // Total players
    expect(screen.getByText('2')).toBeInTheDocument() // Total questions
    expect(screen.getByText('4m')).toBeInTheDocument() // Duration (240 seconds = 4 minutes)
    
    // Test accuracy calculations
    expect(screen.getByText('100% accuracy')).toBeInTheDocument() // Player1: 200/200 = 100%
    expect(screen.getByText('75% accuracy')).toBeInTheDocument() // Player2: 150/200 = 75%
    expect(screen.getByText('50% accuracy')).toBeInTheDocument() // Player3: 100/200 = 50%
    expect(screen.getByText('25% accuracy')).toBeInTheDocument() // Player4: 50/200 = 25%
    
    // Switch to questions view and test question statistics
    const questionsButton = screen.getByText('Question by Question')
    fireEvent.click(questionsButton)
    
    expect(screen.getByText('50% correct')).toBeInTheDocument() // 2 out of 4 correct
    expect(screen.getByText('4 responses')).toBeInTheDocument()
  })
})