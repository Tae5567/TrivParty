import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Leaderboard, CompactLeaderboard } from '../ui/Leaderboard'
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

describe('Leaderboard', () => {
  it('should render leaderboard with default title', () => {
    render(<Leaderboard players={mockPlayers} />)
    
    expect(screen.getByText('Leaderboard')).toBeInTheDocument()
  })

  it('should render custom title', () => {
    render(<Leaderboard players={mockPlayers} title="Final Results" />)
    
    expect(screen.getByText('Final Results')).toBeInTheDocument()
  })

  it('should render players in correct order', () => {
    render(<Leaderboard players={mockPlayers} />)
    
    // Bob should be first with highest score
    const playerElements = screen.getAllByText(/Alice|Bob|Charlie/)
    expect(playerElements[0]).toHaveTextContent('Bob')
    expect(playerElements[1]).toHaveTextContent('Alice')
    expect(playerElements[2]).toHaveTextContent('Charlie')
  })

  it('should show rank badges for top 3 players', () => {
    render(<Leaderboard players={mockPlayers} />)
    
    expect(screen.getByText('1st Place')).toBeInTheDocument()
    expect(screen.getByText('2nd Place')).toBeInTheDocument()
    expect(screen.getByText('3rd Place')).toBeInTheDocument()
  })

  it('should highlight current player', () => {
    render(<Leaderboard players={mockPlayers} currentPlayerId="player-2" />)
    
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('should show stats when enabled', () => {
    render(<Leaderboard players={mockPlayers} showStats={true} />)
    
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('Highest Score')).toBeInTheDocument()
    expect(screen.getByText('Average Score')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // Player count
    
    // Use getAllByText for values that appear multiple times
    const scoreElements = screen.getAllByText('200')
    expect(scoreElements.length).toBeGreaterThan(0) // Highest score appears in stats and player list
    
    const averageElements = screen.getAllByText('150')
    expect(averageElements.length).toBeGreaterThan(0) // Average score (450/3 = 150)
  })

  it('should show final game message when isFinal is true', () => {
    render(<Leaderboard players={mockPlayers} isFinal={true} />)
    
    expect(screen.getByText('🎉 Congratulations to all players! 🎉')).toBeInTheDocument()
  })

  it('should show action buttons when provided', () => {
    const onPlayAgain = vi.fn()
    const onNewQuiz = vi.fn()
    
    render(
      <Leaderboard 
        players={mockPlayers} 
        isFinal={true}
        onPlayAgain={onPlayAgain}
        onNewQuiz={onNewQuiz}
      />
    )
    
    expect(screen.getByText('Play Again')).toBeInTheDocument()
    expect(screen.getByText('New Quiz')).toBeInTheDocument()
  })

  it('should call action callbacks when buttons are clicked', () => {
    const onPlayAgain = vi.fn()
    const onNewQuiz = vi.fn()
    
    render(
      <Leaderboard 
        players={mockPlayers} 
        isFinal={true}
        onPlayAgain={onPlayAgain}
        onNewQuiz={onNewQuiz}
      />
    )
    
    fireEvent.click(screen.getByText('Play Again'))
    fireEvent.click(screen.getByText('New Quiz'))
    
    expect(onPlayAgain).toHaveBeenCalled()
    expect(onNewQuiz).toHaveBeenCalled()
  })

  it('should show empty state when no players', () => {
    render(<Leaderboard players={[]} />)
    
    expect(screen.getByText('No players yet')).toBeInTheDocument()
    expect(screen.getByText('Waiting for players to join...')).toBeInTheDocument()
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

    render(<Leaderboard players={tiedPlayers} />)
    
    // Bob should appear first due to earlier join time
    const playerElements = screen.getAllByText(/Alice|Bob/)
    expect(playerElements[0]).toHaveTextContent('Bob')
    expect(playerElements[1]).toHaveTextContent('Alice')
  })
})

describe('CompactLeaderboard', () => {
  it('should render compact leaderboard', () => {
    render(<CompactLeaderboard players={mockPlayers} />)
    
    expect(screen.getByText('Top Players')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
  })

  it('should limit visible players', () => {
    const manyPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: `player-${i}`,
      sessionId: 'session-1',
      nickname: `Player ${i}`,
      score: 100 - i,
      joinedAt: `2024-01-01T00:0${i}:00Z`
    }))

    render(<CompactLeaderboard players={manyPlayers} maxVisible={3} />)
    
    expect(screen.getByText('Player 0')).toBeInTheDocument()
    expect(screen.getByText('Player 1')).toBeInTheDocument()
    expect(screen.getByText('Player 2')).toBeInTheDocument()
    expect(screen.queryByText('Player 3')).not.toBeInTheDocument()
    expect(screen.getByText('+7 more players')).toBeInTheDocument()
  })

  it('should highlight current player', () => {
    render(<CompactLeaderboard players={mockPlayers} currentPlayerId="player-2" />)
    
    // Bob should be highlighted (he has the highest score)
    // Find the parent div that contains the highlighting classes
    const bobRow = screen.getByText('Bob').closest('.bg-primary\\/10')
    expect(bobRow).toBeInTheDocument()
  })

  it('should show rank numbers', () => {
    render(<CompactLeaderboard players={mockPlayers} />)
    
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })
})