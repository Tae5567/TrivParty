'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ACHIEVEMENTS } from '@/lib/achievements'
import type { UserAchievement } from '@/types/auth'

interface UserProfileProps {
  isOpen: boolean
  onClose: () => void
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, profile, updateProfile, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await updateProfile({
        display_name: displayName.trim() || null,
      })
      setEditing(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign out')
    }
  }

  if (!user || !profile) {
    return null
  }

  const accuracy = profile.total_questions_answered > 0 
    ? Math.round((profile.total_correct_answers / profile.total_questions_answered) * 100)
    : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white text-black border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Profile Info */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Profile Information</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(!editing)}
                disabled={loading}
              >
                {editing ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            {editing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <Input value={profile.username} disabled />
                  <p className="text-xs text-gray-500">Username cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How others see you"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Username: </span>
                  <span className="text-sm">@{profile.username}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Display Name: </span>
                  <span className="text-sm">{profile.display_name || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium">Member since: </span>
                  <span className="text-sm">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Statistics */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {profile.total_games_played}
                </div>
                <div className="text-sm text-gray-600">Games Played</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {profile.total_correct_answers}
                </div>
                <div className="text-sm text-gray-600">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {accuracy}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {profile.best_streak}
                </div>
                <div className="text-sm text-gray-600">Best Streak</div>
              </div>
            </div>
          </Card>

          {/* Achievements */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Achievements</h3>
            {profile.achievements && profile.achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.achievements.map((achievement: UserAchievement) => {
                  const def = ACHIEVEMENTS[achievement.achievement_type as keyof typeof ACHIEVEMENTS]
                  return (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{def?.icon}</div>
                      <div>
                        <div className="font-medium">{def?.name}</div>
                        <div className="text-sm text-gray-600">{def?.description}</div>
                        <div className="text-xs text-gray-500">
                          Earned {new Date(achievement.earned_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No achievements yet. Play some games to earn your first achievement!
              </p>
            )}
          </Card>

          {/* Recent Games */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Games</h3>
            {profile.recentGames && profile.recentGames.length > 0 ? (
              <div className="space-y-2">
                {profile.recentGames.slice(0, 5).map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">Score: {game.final_score}</div>
                      <div className="text-sm text-gray-600">
                        Rank #{game.final_rank} • {game.correct_answers}/{game.questions_answered} correct
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(game.played_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No games played yet. Join or create a game to get started!
              </p>
            )}
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}