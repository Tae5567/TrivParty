import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { PlayerJoin } from '../PlayerJoin'

// Mock fetch
global.fetch = vi.fn()

const mockOnPlayerJoined = vi.fn()

describe('PlayerJoin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fetch as any).mockClear()
  })

  it('renders join form with nickname input', () => {
    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    expect(screen.getByText('Join Quiz Session')).toBeInTheDocument()
    expect(screen.getByLabelText(/join code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/your nickname/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join game/i })).toBeInTheDocument()
  })

  it('renders without join code input when sessionId is provided', () => {
    render(<PlayerJoin sessionId="session-123" onPlayerJoined={mockOnPlayerJoined} />)
    
    expect(screen.queryByLabelText(/join code/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/your nickname/i)).toBeInTheDocument()
  })

  it('pre-fills join code when provided', () => {
    render(<PlayerJoin joinCode="ABC123" onPlayerJoined={mockOnPlayerJoined} />)
    
    const joinCodeInput = screen.getByLabelText(/join code/i) as HTMLInputElement
    expect(joinCodeInput.value).toBe('ABC123')
  })

  it('validates nickname requirements', async () => {
    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    // Test empty nickname
    fireEvent.click(joinButton)
    await waitFor(() => {
      expect(screen.getByText('Nickname is required')).toBeInTheDocument()
    })

    // Test nickname too long
    fireEvent.change(nicknameInput, { target: { value: 'a'.repeat(21) } })
    fireEvent.click(joinButton)
    await waitFor(() => {
      expect(screen.getByText('Nickname must be 20 characters or less')).toBeInTheDocument()
    })

    // Test invalid characters
    fireEvent.change(nicknameInput, { target: { value: 'test@user' } })
    fireEvent.click(joinButton)
    await waitFor(() => {
      expect(screen.getByText('Nickname can only contain letters, numbers, and spaces')).toBeInTheDocument()
    })
  })

  it('requires join code when sessionId is not provided', async () => {
    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a join code')).toBeInTheDocument()
    })
  })

  it('joins session successfully with sessionId', async () => {
    const mockResponse = {
      playerId: 'player-123',
      playerToken: 'token-123',
      sessionId: 'session-123',
      nickname: 'TestUser',
    }

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(<PlayerJoin sessionId="session-123" onPlayerJoined={mockOnPlayerJoined} />)
    
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    fireEvent.click(joinButton)

    expect(joinButton).toBeDisabled()
    expect(screen.getByText('Joining...')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'session-123',
          joinCode: undefined,
          nickname: 'TestUser',
        }),
      })
    })

    await waitFor(() => {
      expect(mockOnPlayerJoined).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('joins session successfully with join code', async () => {
    const mockResponse = {
      playerId: 'player-123',
      playerToken: 'token-123',
      sessionId: 'session-123',
      nickname: 'TestUser',
    }

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    const joinCodeInput = screen.getByLabelText(/join code/i)
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(joinCodeInput, { target: { value: 'abc123' } })
    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: undefined,
          joinCode: 'ABC123', // Should be uppercase
          nickname: 'TestUser',
        }),
      })
    })

    await waitFor(() => {
      expect(mockOnPlayerJoined).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('converts join code to uppercase', () => {
    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    const joinCodeInput = screen.getByLabelText(/join code/i) as HTMLInputElement
    
    fireEvent.change(joinCodeInput, { target: { value: 'abc123' } })
    expect(joinCodeInput.value).toBe('ABC123')
  })

  it('handles session not found error', async () => {
    const mockError = { error: 'Session not found' }

    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError),
    })

    render(<PlayerJoin sessionId="session-123" onPlayerJoined={mockOnPlayerJoined} />)
    
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText('Session not found')).toBeInTheDocument()
    })

    expect(mockOnPlayerJoined).not.toHaveBeenCalled()
  })

  it('handles nickname already taken error', async () => {
    const mockError = { error: 'Nickname is already taken in this session' }

    ;(fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError),
    })

    render(<PlayerJoin sessionId="session-123" onPlayerJoined={mockOnPlayerJoined} />)
    
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText('Nickname is already taken in this session')).toBeInTheDocument()
    })

    expect(mockOnPlayerJoined).not.toHaveBeenCalled()
  })

  it('handles network error', async () => {
    ;(fetch as any).mockRejectedValueOnce(new Error('Network error'))

    render(<PlayerJoin sessionId="session-123" onPlayerJoined={mockOnPlayerJoined} />)
    
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    expect(mockOnPlayerJoined).not.toHaveBeenCalled()
  })

  it('disables join button when form is invalid', () => {
    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    const joinButton = screen.getByRole('button', { name: /join game/i })
    
    // Should be disabled initially
    expect(joinButton).toBeDisabled()

    // Should be disabled with only nickname
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    fireEvent.change(nicknameInput, { target: { value: 'TestUser' } })
    expect(joinButton).toBeDisabled()

    // Should be enabled with both nickname and join code
    const joinCodeInput = screen.getByLabelText(/join code/i)
    fireEvent.change(joinCodeInput, { target: { value: 'ABC123' } })
    expect(joinButton).not.toBeDisabled()
  })

  it('trims whitespace from inputs', async () => {
    const mockResponse = {
      playerId: 'player-123',
      playerToken: 'token-123',
      sessionId: 'session-123',
      nickname: 'TestUser',
    }

    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(<PlayerJoin onPlayerJoined={mockOnPlayerJoined} />)
    
    const joinCodeInput = screen.getByLabelText(/join code/i)
    const nicknameInput = screen.getByLabelText(/your nickname/i)
    const joinButton = screen.getByRole('button', { name: /join game/i })

    fireEvent.change(joinCodeInput, { target: { value: '  ABC123  ' } })
    fireEvent.change(nicknameInput, { target: { value: '  TestUser  ' } })
    fireEvent.click(joinButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/session/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: undefined,
          joinCode: 'ABC123',
          nickname: 'TestUser',
        }),
      })
    })
  })
})