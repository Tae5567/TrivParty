'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthContextType, AuthUser, UserProfile, UserProfileUpdate } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // If profile doesn't exist, that's expected for new users
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId)
          return null
        }
        console.error('Error fetching profile:', error.message || error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error instanceof Error ? error.message : error)
      return null
    }
  }

  // Create user profile after signup
  const createProfile = async (userId: string, username: string, displayName?: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          username,
          display_name: displayName || username,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating profile:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
          }
          setUser(authUser)

          // Fetch user profile
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
          }
          setUser(authUser)

          // Fetch user profile
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (emailOrUsername: string, password: string) => {
    // Check if input is an email or username
    const isEmail = emailOrUsername.includes('@')
    
    if (isEmail) {
      // Sign in with email
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      })

      if (error) {
        throw error
      }
    } else {
      // For username sign-in, we'll use a server-side API endpoint
      const response = await fetch('/api/auth/signin-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: emailOrUsername,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid username or password')
      }

      // The server will return the session, we need to set it
      if (data.session) {
        const { error } = await supabase.auth.setSession(data.session)
        if (error) {
          throw error
        }
      }
    }
  }

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    // Check if username is already taken
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single()

    if (existingUser) {
      throw new Error('Username is already taken')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    if (data.user) {
      // Create user profile
      await createProfile(data.user.id, username, displayName)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
  }

  const updateProfile = async (updates: UserProfileUpdate) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    setProfile(data)
  }

  const refreshProfile = async () => {
    if (!user) return

    const userProfile = await fetchProfile(user.id)
    setProfile(userProfile)
  }

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}