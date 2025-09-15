'use client'

import { useState } from 'react'
import { GameReplay, ReplayQuestionResult } from '@/types/replay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Trophy, Users, Clock, CheckCircle, XCircle } from 'lucide-react'

interface ReplayViewerProps {
  replay: GameReplay
}

export function ReplayViewer({ replay }: ReplayViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'overview' | 'questions'>('overview')

  const currentQuestion = replay.questionResults[currentQuestionIndex]

  const nextQuestion = () => {
    if (currentQuestionIndex < replay.questionResults.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const getAnswerStats = (question: ReplayQuestionResult) => {
    const totalAnswers = question.playerAnswers.length
    const correctAnswers = question.playerAnswers.filter(a => a.isCorrect).length
    return {
      total: totalAnswers,
      correct: correctAnswers,
      percentage: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0
    }
  }

  const getOptionStats = (question: ReplayQuestionResult) => {
    const optionCounts = question.options.reduce((acc, option) => {
      acc[option] = question.playerAnswers.filter(a => a.selectedAnswer === option).length
      return acc
    }, {} as Record<string, number>)

    return question.options.map(option => ({
      option,
      count: optionCounts[option] || 0,
      percentage: question.playerAnswers.length > 0 
        ? Math.round((optionCounts[option] || 0) / question.playerAnswers.length * 100)
        : 0,
      isCorrect: option === question.correctAnswer
    }))
  }

  if (viewMode === 'overview') {
    return (
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'overview' ? 'default' : 'outline'}
              onClick={() => setViewMode('overview')}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Final Results
            </Button>
            <Button
              variant={viewMode === 'questions' ? 'default' : 'outline'}
              onClick={() => setViewMode('questions')}
            >
              <Users className="w-4 h-4 mr-2" />
              Question by Question
            </Button>
          </div>
        </div>

        {/* Final Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Final Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {replay.finalScores.map((player, index) => (
                <div
                  key={player.playerId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    index === 0 ? 'bg-yellow-50 border-yellow-200' :
                    index === 1 ? 'bg-gray-50 border-gray-200' :
                    index === 2 ? 'bg-orange-50 border-orange-200' :
                    'bg-background'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-500 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {player.rank}
                    </div>
                    <div>
                      <p className="font-medium">{player.nickname}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((player.score / (replay.totalQuestions * 100)) * 100)}% accuracy
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{player.score}</p>
                    <p className="text-sm text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quiz Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold">{replay.totalPlayers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-2xl font-bold">{replay.totalQuestions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">
                    {replay.sessionDurationSeconds 
                      ? `${Math.floor(replay.sessionDurationSeconds / 60)}m`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex justify-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Final Results
          </Button>
          <Button
            variant={viewMode === 'questions' ? 'default' : 'outline'}
            onClick={() => setViewMode('questions')}
          >
            <Users className="w-4 h-4 mr-2" />
            Question by Question
          </Button>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {replay.questionResults.length}
          </p>
          <Progress 
            value={((currentQuestionIndex + 1) / replay.questionResults.length) * 100} 
            className="w-32 mx-auto mt-1"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={nextQuestion}
          disabled={currentQuestionIndex === replay.questionResults.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {currentQuestion && (
        <div className="space-y-6">
          {/* Question */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{currentQuestion.questionText}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Question {currentQuestion.questionOrder}</span>
                <span>•</span>
                <span>{currentQuestion.playerAnswers.length} responses</span>
                <span>•</span>
                <span>{getAnswerStats(currentQuestion).percentage}% correct</span>
              </div>
            </CardHeader>
          </Card>

          {/* Answer Options with Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Answer Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getOptionStats(currentQuestion).map((optionStat, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      optionStat.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {optionStat.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="font-medium">{optionStat.option}</span>
                        {optionStat.isCorrect && (
                          <Badge variant="secondary" className="text-xs">
                            Correct
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {optionStat.count} ({optionStat.percentage}%)
                      </div>
                    </div>
                    <Progress 
                      value={optionStat.percentage} 
                      className={`h-2 ${optionStat.isCorrect ? 'bg-green-100' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Player Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Player Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentQuestion.playerAnswers.map((answer, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border ${
                      answer.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {answer.isCorrect ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium">{answer.nickname}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {answer.selectedAnswer}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Explanation */}
          {currentQuestion.explanation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{currentQuestion.explanation}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}