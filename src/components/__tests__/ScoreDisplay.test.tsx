import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay, ScoreUpdate } from '../ScoreDisplay'
import type { Player } from '@/types'

const mockPlayers: Player[] = [
  {
    id: 'player-1',
    sessionId: 'session-1',
    nickname: 'Alice',
    score: 150,
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'player-2',
    sessionId: 'session-1',
    nickname: 'Bob',
    score: 200,
    joinedAt: '2024-01-01T00:01:00Z'
  },
  {
    id: 'player-3',
    sessionId: 'session-1',
    nickname: 'Charlie',
    score: 100,
    joinedAt: '2024-01-01T00:02:00Z'
  }
]

describe('ScoreDisplay', () => {
  it('should render players sorted by score', () => {
    render(<ScoreDisplay players={mockPlayers} />)
    
    expect(screen.getByText('Current Scores')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
    
    // Check scores are displayed
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should highlight current player', () => {
    render(<ScoreDisplay players={mockPlayers} currentPlayerId="player-2" />)
    
    expect(screen.getByText('(You)')).toBeInTheDocument()
  })

  it('should show rankings when enabled', () => {
    render(<ScoreDisplay players={mockPlayers} showRanking={true} />)
    
    expect(screen.getByText('1st')).toBeInTheDocument()
    expect(screen.getByText('2nd')).toBeInTheDocument()
    expect(screen.getByText('3rd')).toBeInTheDocument()
  })

  it('should render compact view', () => {
    render(<ScoreDisplay players={mockPlayers} compact={true} />)
    
    // In compact mode, should not show "Current Scores" title
    expect(screen.queryByText('Current Scores')).not.toBeInTheDocument()
    
    // But should still show player names and scores
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('should show empty state when no players', () => {
    render(<ScoreDisplay players={[]} />)
    
    expect(screen.getByText('No players yet')).toBeInTheDocument()
  })

  it('should handle tie-breaking by join time', () => {
    const tiedPlayers: Player[] = [
      {
        id: 'player-1',
        sessionId: 'session-1',
        nickname: 'Alice',
        score: 100,
        joinedAt: '2024-01-01T00:02:00Z' // Joined later
      },
      {
        id: 'player-2',
        sessionId: 'session-1',
        nickname: 'Bob',
        score: 100,
        joinedAt: '2024-01-01T00:01:00Z' // Joined earlier
      }
    ]

    render(<ScoreDisplay players={tiedPlayers} />)
    
    // Bob should appear first due to earlier join time
    const playerElements = screen.getAllByText(/Alice|Bob/)
    expect(playerElements[0]).toHaveTextContent('Bob')
    expect(playerElements[1]).toHaveTextContent('Alice')
  })
})

describe('ScoreUpdate', () => {
  it('should render positive score update', () => {
    render(<ScoreUpdate pointsEarned={100} isVisible={true} />)
    
    expect(screen.getByText('+100')).toBeInTheDocument()
  })

  it('should render zero score update as hidden', () => {
    render(<ScoreUpdate pointsEarned={0} isVisible={true} />)
    
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('should not render when not visible', () => {
    render(<ScoreUpdate pointsEarned={100} isVisible={false} />)
    
    expect(screen.queryByText('+100')).not.toBeInTheDocument()
  })

  it('should call onAnimationComplete after timeout', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    
    render(<ScoreUpdate pointsEarned={100} isVisible={true} onAnimationComplete={onComplete} />)
    
    // Fast-forward time
    vi.advanceTimersByTime(2000)
    
    expect(onComplete).toHaveBeenCalled()
    
    vi.useRealTimers()
  })
})