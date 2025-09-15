'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PlayerJoin } from '@/components/PlayerJoin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Users, Clock, Target } from 'lucide-react'
import type { PlayerJoinResponse } from '@/types'

export default function JoinPage() {
  const router = useRouter()
  const [isJoining, setIsJoining] = useState(false)

  const handlePlayerJoined = async (playerData: PlayerJoinResponse & { nickname: string; sessionId: string }) => {
    setIsJoining(true)
    // Store player data in localStorage for the session
    localStorage.setItem('playerData', JSON.stringify(playerData))
    
    // Redirect to the game session with player ID
    router.push(`/play/${playerData.sessionId}?playerId=${playerData.playerId}`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden"
         style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #C084FC 50%, #A855F7 75%, #8B5CF6 100%)' }}>
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm floating" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-40 left-20 w-24 h-24 rounded-full bg-white/5 backdrop-blur-sm floating" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-32 right-32 w-40 h-40 rounded-full bg-white/5 backdrop-blur-sm floating" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 glass-card flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">TrivParty</h1>
          </Link>
          <Link href="/">
            <button className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Join a Quiz Game
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Enter your join code and nickname to start playing trivia with friends!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Join Form */}
            <div className="order-2 lg:order-1">
              <PlayerJoin onPlayerJoined={handlePlayerJoined} />
            </div>

            {/* Game Rules */}
            <div className="order-1 lg:order-2">
              <div className="glass-card p-6">
                <div className="mb-6">
                  <h3 className="flex items-center gap-3 text-2xl font-bold text-white mb-2">
                    <Target className="h-6 w-6" />
                    How to Play
                  </h3>
                  <p className="text-white/70">
                    Quick rules to get you started
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 glass-card flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Join the Session</h4>
                      <p className="text-white/70">
                        Enter the 6-character join code provided by your host and choose a unique nickname.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 glass-card flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Wait in the Lobby</h4>
                      <p className="text-white/70">
                        You&apos;ll see other players joining. The host will start the game when everyone is ready.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 glass-card flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Answer Questions</h4>
                      <p className="text-white/70">
                        Select your answer from multiple choices. Faster correct answers earn more points!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 glass-card flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-white">Compete & Win</h4>
                      <p className="text-white/70">
                        Watch the leaderboard update in real-time and see who comes out on top!
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/20 pt-6 mt-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="flex flex-col items-center">
                        <Users className="w-6 h-6 text-white mb-2" />
                        <div className="text-sm font-semibold text-white">Multiplayer</div>
                        <div className="text-xs text-white/60">Up to 20 players</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <Clock className="w-6 h-6 text-white mb-2" />
                        <div className="text-sm font-semibold text-white">Real-time</div>
                        <div className="text-xs text-white/60">Live scoring</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <div className="glass-card p-8">
              <h3 className="text-2xl font-semibold mb-4 text-white">Don&apos;t have a join code?</h3>
              <p className="text-white/70 mb-6 text-lg">
                Ask your host to share the join code, or create your own quiz to host a game.
              </p>
              <Link href="/create">
                <button className="glass-button px-6 py-3 rounded-full text-white font-medium">
                  Create Your Own Quiz
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}