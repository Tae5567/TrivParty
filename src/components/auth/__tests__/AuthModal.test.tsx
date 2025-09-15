import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthModal } from '../AuthModal'
import { AuthProvider } from '@/contexts/AuthProvider'

import { vi } from 'vitest'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { it } from 'zod/v4/locales'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock the auth context
const mockSignIn = vi.fn()
const mockSignUp = vi.fn()

vi.mock('@/contexts/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    user: null,
    profile: null,
    loading: false,
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}))

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign in form by default', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />)
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.queryByLabelText('Username')).not.toBeInTheDocument()
  })

  it('switches to sign up mode', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} />)
    
    fireEvent.click(screen.getByText("Don't have an account? Sign up"))
    
    expect(screen.getByText('Create Account')).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Display Name (Optional)')).toBeInTheDocument()
  })

  it('handles sign in submission', async () => {
    mockSignIn.mockResolvedValue(undefined)
    const onClose = vi.fn()
    
    render(<AuthModal isOpen={true} onClose={onClose} />)
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('handles sign up submission', async () => {
    mockSignUp.mockResolvedValue(undefined)
    const onClose = vi.fn()
    
    render(<AuthModal isOpen={true} onClose={onClose} defaultMode="signup" />)
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText('Display Name (Optional)'), {
      target: { value: 'Test User' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', 'testuser', 'Test User')
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('displays error messages', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'))
    
    render(<AuthModal isOpen={true} onClose={vi.fn()} />)
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('requires username for sign up', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} defaultMode="signup" />)
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument()
    })
  })
})