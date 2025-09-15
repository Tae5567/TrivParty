//src/components/QuizPreview.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Play, RotateCcw, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { AuthModal } from './auth/AuthModal'

interface QuizPreviewProps {
  quiz: {
    id: string
    title: string
    sourceUrl: string
    questions: Array<{
      id: string
      text: string
      options: string[]
      correctAnswer: string
      explanation: string
    }>
  }
  onStartOver: () => void
  onUseQuiz: () => void
}

export function QuizPreview({ quiz, onStartOver, onUseQuiz }: QuizPreviewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useAuth()

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const isFirstQuestion = currentQuestionIndex === 0

  const handleNextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowAnswer(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1)
      setShowAnswer(false)
    }
  }

  const toggleAnswer = () => {
    setShowAnswer(prev => !prev)
  }

  const handleUseQuiz = async () => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    try {
      // Create a session for this quiz
      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quiz.id,
          hostId: user.id,
        }),
      })

      if (response.ok) {
        const { session } = await response.json()
        // Redirect to the session lobby as host
        window.location.href = `/play/${session.id}?isHost=true&hostId=${session.hostId}`
      } else {
        const error = await response.json()
        alert(`Failed to create session: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Failed to create game session. Please try again.')
    }
  }

  const getSourceDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname
      if (domain.includes('wikipedia')) return 'Wikipedia'
      if (domain.includes('youtube')) return 'YouTube'
      return domain
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" data-onboarding="quiz-preview">
      {/* Quiz Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3 min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-white truncate">{quiz.title}</h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                  {quiz.questions.length} Questions
                </span>
                <span className="text-white/70">Source: {getSourceDomain(quiz.sourceUrl)}</span>
              </div>
              <a 
                href={quiz.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Original
              </a>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={onStartOver}
              className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Start Over</span>
            </button>
            <button 
              onClick={handleUseQuiz}
              className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-white font-medium transition-all duration-300 backdrop-blur-sm border border-white/30 flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Use This Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Question Preview */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h4 className="text-xl font-bold text-white">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousQuestion}
              disabled={isFirstQuestion}
              className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={isLastQuestion}
              className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="space-y-6">
          {/* Question Text */}
          <div className="space-y-4">
            <h3 className="text-xl font-medium leading-relaxed text-white">
              {currentQuestion.text}
            </h3>

            {/* Answer Options */}
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = option === currentQuestion.correctAnswer
                const optionLetter = String.fromCharCode(65 + index) // A, B, C, D

                return (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border transition-colors
                      ${showAnswer && isCorrect 
                        ? 'bg-green-500/20 border-green-400/50' 
                        : 'bg-white/10 border-white/20 hover:bg-white/15'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <span 
                        className={`px-3 py-1 rounded-full text-sm font-medium min-w-[32px] text-center ${
                          showAnswer && isCorrect 
                            ? 'bg-green-500 text-white' 
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {optionLetter}
                      </span>
                      <span className="flex-1 text-white">{option}</span>
                      {showAnswer && isCorrect && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          Correct
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Show/Hide Answer Button */}
            <div className="flex justify-center">
              <button
                onClick={toggleAnswer}
                className="glass-button px-6 py-2 rounded-full text-white font-medium"
              >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
            </div>

            {/* Explanation */}
            {showAnswer && (
              <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                <h4 className="font-medium text-blue-200 mb-2">
                  Explanation:
                </h4>
                <p className="text-blue-100 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 flex-wrap">
        {quiz.questions.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentQuestionIndex(index)
              setShowAnswer(false)
            }}
            className={`
              w-3 h-3 rounded-full transition-colors touch-manipulation
              ${index === currentQuestionIndex 
                ? 'bg-white' 
                : 'bg-white/30 hover:bg-white/50'
              }
            `}
            aria-label={`Go to question ${index + 1}`}
          />
        ))}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </div>
  )
}