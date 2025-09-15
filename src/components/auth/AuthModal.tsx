'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthProvider'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        if (!username.trim()) {
          throw new Error('Username is required')
        }
        await signUp(email, password, username.trim(), displayName.trim() || undefined)
      }
      onClose()
      resetForm()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setDisplayName('')
    setError('')
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white text-black border-0 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            {mode === 'signin' ? 'Welcome Back' : 'Join TrivParty'}
          </DialogTitle>
          <p className="text-gray-600 text-sm mt-1">
            {mode === 'signin' 
              ? 'Sign in to your account to continue' 
              : 'Create your account to get started'
            }
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              {mode === 'signin' ? 'Email or Username' : 'Email'}
            </label>
            <Input
              id="email"
              type={mode === 'signin' ? 'text' : 'email'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="bg-white border-gray-300 text-black placeholder-gray-500"
              placeholder={mode === 'signin' ? 'Enter your email or username' : 'Enter your email'}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
              className="bg-white border-gray-300 text-black placeholder-gray-500"
              placeholder="Enter your password"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Choose a unique username"
                  className="bg-white border-gray-300 text-black placeholder-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                  Display Name (Optional)
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  placeholder="How others will see you"
                  className="bg-white border-gray-300 text-black placeholder-gray-500"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
              disabled={loading}
            >
              {mode === 'signin' 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}