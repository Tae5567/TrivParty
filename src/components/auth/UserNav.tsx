'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { AuthModal } from './AuthModal'
import { UserProfile } from './UserProfile'
import { FriendsManager } from './FriendsManager'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ThemeSettings } from '@/components/ui/ThemeSettings'

export function UserNav() {
  const { user, profile, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showFriends, setShowFriends] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ThemeSettings />
          <Button
            variant="outline"
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </Button>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ThemeSettings />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFriends(true)}
          className="text-sm"
        >
          Friends
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {(profile?.display_name || profile?.username || 'U')[0].toUpperCase()}
          </div>
          <span className="hidden sm:inline">
            {profile?.display_name || profile?.username}
          </span>
        </Button>
      </div>

      <UserProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />

      <FriendsManager
        isOpen={showFriends}
        onClose={() => setShowFriends(false)}
      />
    </>
  )
}