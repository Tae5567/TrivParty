import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { RealtimeProvider, useRealtime, useSessionRealtime } from '../RealtimeProvider'
import React from 'react'

// Mock the RealtimeConnectionManager
const mockConnectionManager = {
  subscribeToChannel: vi.fn(),
  unsubscribeFromChannel: vi.fn(),
  cleanup: vi.fn(),
  getConnectionStatus: vi.fn().mockReturnValue('0'), // Start with CONNECTING
  getActiveChannels: vi.fn().mockReturnValue([]),
}

vi.mock('@/lib/supabase', () => ({
  RealtimeConnectionManager: vi.fn().mockImplementation(() => mockConnectionManager),
}))

// Test component that uses the realtime context
function TestComponent() {
  const { connectionStatus, isConnected, subscribeToSession, unsubscribeFromSession } = useRealtime()
  
  return (
    <div>
      <div data-testid="connection-status">{connectionStatus}</div>
      <div data-testid="is-connected">{isConnected.toString()}</div>
      <button 
        onClick={() => subscribeToSession('test-session', {})}
        data-testid="subscribe-btn"
      >
        Subscribe
      </button>
      <button 
        onClick={() => unsubscribeFromSession('test-session')}
        data-testid="unsubscribe-btn"
      >
        Unsubscribe
      </button>
    </div>
  )
}

// Test component that uses session realtime hook
function SessionTestComponent({ sessionId }: { sessionId: string | null }) {
  const { isConnected } = useSessionRealtime(sessionId, {
    onPlayerJoined: vi.fn(),
    onPlayerLeft: vi.fn(),
    onGameStateChanged: vi.fn(),
  })
  
  return (
    <div data-testid="session-connected">{isConnected.toString()}</div>
  )
}

describe('RealtimeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('provider initialization', () => {
    it('should render children and provide context', () => {
      render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      expect(screen.getByTestId('connection-status')).toBeInTheDocument()
      expect(screen.getByTestId('is-connected')).toBeInTheDocument()
    })

    it('should start with connecting status', async () => {
      render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      // Initially should be connecting
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting')
      expect(screen.getByTestId('is-connected')).toHaveTextContent('false')
    })

    it('should update to connected status', async () => {
      render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      // Change mock to return connected status
      mockConnectionManager.getConnectionStatus.mockReturnValue('1') // OPEN

      // Fast-forward to trigger connection status check
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
        expect(screen.getByTestId('is-connected')).toHaveTextContent('true')
      })
    })
  })

  describe('connection status monitoring', () => {
    it('should handle different connection states', async () => {
      render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      // Test CONNECTING state (already set in beforeEach)
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connecting')

      // Test CONNECTED state
      mockConnectionManager.getConnectionStatus.mockReturnValue('1')
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
      })

      // Test CLOSED state
      mockConnectionManager.getConnectionStatus.mockReturnValue('3')
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
      })

      // Test ERROR state
      mockConnectionManager.getConnectionStatus.mockReturnValue('unknown')
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('error')
      })
    })
  })

  describe('session subscription', () => {
    it('should subscribe to session with callbacks', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      }
      mockConnectionManager.subscribeToChannel.mockReturnValue(mockChannel)

      render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      // Wait for connection
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      const subscribeBtn = screen.getByTestId('subscribe-btn')
      act(() => {
        subscribeBtn.click()
      })

      expect(mockConnectionManager.subscribeToChannel).toHaveBeenCalledWith(
        'session:test-session',
        {
          config: {
            broadcast: { self: true },
            presence: { key: 'test-session' },
          },
        }
      )

      // Verify database change subscriptions
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        expect.objectContaining({
          event: 'INSERT',
          schema: 'public',
          table: 'players',
          filter: 'session_id=eq.test-session',
        }),
        expect.any(Function)
      )

      // Verify broadcast subscriptions
      expect(mockChannel.on).toHaveBeenCalledWith(
        'broadcast',
        { event: 'question_changed' },
        expect.any(Function)
      )
    })

    it('should unsubscribe from session', async () => {
      render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      const unsubscribeBtn = screen.getByTestId('unsubscribe-btn')
      act(() => {
        unsubscribeBtn.click()
      })

      expect(mockConnectionManager.unsubscribeFromChannel).toHaveBeenCalledWith(
        'session:test-session'
      )
    })
  })

  describe('useSessionRealtime hook', () => {
    it('should subscribe when session ID is provided and connected', async () => {
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      }
      mockConnectionManager.subscribeToChannel.mockReturnValue(mockChannel)
      
      // Set to connected state
      mockConnectionManager.getConnectionStatus.mockReturnValue('1')

      render(
        <RealtimeProvider>
          <SessionTestComponent sessionId="test-session" />
        </RealtimeProvider>
      )

      // Wait for connection status to update
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockConnectionManager.subscribeToChannel).toHaveBeenCalledWith(
          'session:test-session',
          expect.any(Object)
        )
      })
    })

    it('should not subscribe when session ID is null', () => {
      render(
        <RealtimeProvider>
          <SessionTestComponent sessionId={null} />
        </RealtimeProvider>
      )

      expect(mockConnectionManager.subscribeToChannel).not.toHaveBeenCalled()
    })

    it('should unsubscribe on cleanup', async () => {
      // Set to connected state first
      mockConnectionManager.getConnectionStatus.mockReturnValue('1')
      
      const { unmount } = render(
        <RealtimeProvider>
          <SessionTestComponent sessionId="test-session" />
        </RealtimeProvider>
      )

      // Wait for connection and subscription
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // Verify subscription happened first
      await waitFor(() => {
        expect(mockConnectionManager.subscribeToChannel).toHaveBeenCalled()
      })

      unmount()

      expect(mockConnectionManager.unsubscribeFromChannel).toHaveBeenCalledWith(
        'session:test-session'
      )
    })
  })

  describe('error handling', () => {
    it('should throw error when useRealtime is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useRealtime must be used within a RealtimeProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('cleanup', () => {
    it('should cleanup connection manager on unmount', () => {
      const { unmount } = render(
        <RealtimeProvider>
          <TestComponent />
        </RealtimeProvider>
      )

      unmount()

      expect(mockConnectionManager.cleanup).toHaveBeenCalled()
    })
  })
})