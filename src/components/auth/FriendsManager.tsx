'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { Friend, FriendRequest } from '@/types/auth'

interface FriendsManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function FriendsManager({ isOpen, onClose }: FriendsManagerProps) {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends')

  useEffect(() => {
    if (isOpen && user) {
      fetchFriends()
      fetchFriendRequests()
    }
  }, [isOpen, user])

  const fetchFriends = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/auth/friends', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFriends(data.friends)
      }
    } catch (error) {
      console.error('Error fetching friends:', error)
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/auth/friends/requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFriendRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/auth/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setUsername('')
        setActiveTab('requests')
        // Optionally show success message
      } else {
        setError(data.error || 'Failed to send friend request')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request')
    } finally {
      setLoading(false)
    }
  }

  const respondToFriendRequest = async (friendshipId: string, action: 'accept' | 'decline') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/auth/friends/requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ friendshipId, action }),
      })

      if (response.ok) {
        await fetchFriendRequests()
        if (action === 'accept') {
          await fetchFriends()
        }
      }
    } catch (error) {
      console.error('Error responding to friend request:', error)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white text-black border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Friends</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'friends'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Requests ({friendRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Add Friend
            </button>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Friends List */}
          {activeTab === 'friends' && (
            <div className="space-y-2">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <Card key={friend.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {friend.profile.display_name || friend.profile.username}
                        </div>
                        <div className="text-sm text-gray-600">
                          @{friend.profile.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          Friends since {new Date(friend.friendsSince).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Invite to Game
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No friends yet. Add some friends to play together!
                </div>
              )}
            </div>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-2">
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <Card key={request.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {request.requester.display_name || request.requester.username}
                        </div>
                        <div className="text-sm text-gray-600">
                          @{request.requester.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => respondToFriendRequest(request.id, 'accept')}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => respondToFriendRequest(request.id, 'decline')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No pending friend requests.
                </div>
              )}
            </div>
          )}

          {/* Add Friend */}
          {activeTab === 'add' && (
            <Card className="p-4">
              <h3 className="font-medium mb-4">Send Friend Request</h3>
              <form onSubmit={sendFriendRequest} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username (e.g., @johndoe)"
                    disabled={loading}
                  />
                </div>
                <Button type="submit" disabled={loading || !username.trim()}>
                  {loading ? 'Sending...' : 'Send Friend Request'}
                </Button>
              </form>
            </Card>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}