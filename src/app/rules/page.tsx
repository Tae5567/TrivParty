import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Trophy,
  ArrowLeft,
  Users,
  Clock,
  Target,
  Zap,
  Globe,
  Youtube,
  Play,
  Award,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 sm:py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">TrivParty</h1>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="sm:size-default">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <Link href="/join">
              <Button size="sm" className="sm:size-default">
                Join Game
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Game Rules & Instructions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to know to create, host, and play TrivParty games
            </p>
          </div>

          {/* Quick Start */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get playing in under 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-primary">To Host a Game:</h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                      Click &quot;Create Quiz&quot; and paste a Wikipedia or YouTube URL
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                      Review the AI-generated questions and create a session
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                      Share the join code with friends and start the game
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3 text-primary">To Join a Game:</h4>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                      Click &quot;Join Game&quot; and enter the 6-character join code
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                      Choose a unique nickname (max 20 characters)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                      Wait in the lobby until the host starts the game
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Content Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Content Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Wikipedia Articles</h4>
                    <p className="text-sm text-muted-foreground">
                      Paste any Wikipedia URL to generate questions from encyclopedic content.
                      Perfect for educational topics, history, science, and more.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Youtube className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">YouTube Videos</h4>
                    <p className="text-sm text-muted-foreground">
                      Use educational YouTube videos with transcripts.
                      Great for lectures, documentaries, and tutorial content.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gameplay */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Gameplay Mechanics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Multiple Choice Questions</h4>
                    <p className="text-sm text-muted-foreground">
                      Each question has 4 answer options with only one correct answer.
                      Questions are generated with explanations for learning.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Real-time Competition</h4>
                    <p className="text-sm text-muted-foreground">
                      All players see questions simultaneously. Faster correct answers
                      earn more points with live leaderboard updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoring System */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Scoring System
              </CardTitle>
              <CardDescription>
                How points are calculated and awarded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h4 className="font-semibold mb-2">Correct Answer</h4>
                  <p className="text-sm text-muted-foreground">
                    Base points for correct answers, with bonus points for speed
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h4 className="font-semibold mb-2">Incorrect Answer</h4>
                  <p className="text-sm text-muted-foreground">
                    No points awarded, but you can still learn from the explanation
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h4 className="font-semibold mb-2">Speed Bonus</h4>
                  <p className="text-sm text-muted-foreground">
                    Answer faster to earn bonus points and climb the leaderboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Limits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">20</div>
                  <div className="text-sm text-muted-foreground">Max Players</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">10</div>
                  <div className="text-sm text-muted-foreground">Avg Questions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">6</div>
                  <div className="text-sm text-muted-foreground">Join Code Length</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">∞</div>
                  <div className="text-sm text-muted-foreground">Sessions per Day</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Pro Tips</CardTitle>
              <CardDescription>
                Make the most of your TrivParty experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">For Hosts:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      Choose content that is interesting to your audience
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      Review questions before starting the game
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      Wait for all players to join before starting
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary">For Players:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      Read questions carefully before answering
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      Speed matters, but accuracy is key
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      Learn from explanations after each question
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center mt-12">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="py-8">
                <h3 className="text-2xl font-bold mb-4">Ready to Play?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Start your trivia adventure now!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/create">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      <Zap className="w-5 h-5 mr-2" />
                      Create Quiz
                    </Button>
                  </Link>
                  <Link href="/join">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                      <Play className="w-5 h-5 mr-2" />
                      Join Game
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}