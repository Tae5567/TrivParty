//src/app/create/page.tsx
'use client'

import Link from 'next/link'
import { QuizGenerator } from '@/components/QuizGenerator'
import { Button } from '@/components/ui/button'
import { OnboardingOverlay } from '@/components/ui/OnboardingOverlay'
import { useOnboarding } from '@/contexts/OnboardingProvider'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useState, useEffect } from 'react'

const quizCreationSteps = [
  {
    id: 'url-input',
    title: 'Enter Content URL',
    description: 'Paste a Wikipedia article or YouTube video URL here. AI will extract the content and generate quiz questions.',
    targetSelector: '[data-onboarding="url-input"]',
    position: 'bottom' as const,
    action: 'Try pasting: https://en.wikipedia.org/wiki/Solar_System'
  },
  {
    id: 'generate-button',
    title: 'Generate Questions',
    description: 'Click this button to let AI create engaging multiple-choice questions from your content.',
    targetSelector: '[data-onboarding="generate-button"]',
    position: 'top' as const,
    action: 'Click "Generate Quiz" to see the magic happen!'
  },
  {
    id: 'quiz-preview',
    title: 'Review Your Quiz',
    description: 'Preview the generated questions and make any adjustments before creating your game session.',
    targetSelector: '[data-onboarding="quiz-preview"]',
    position: 'top' as const,
    action: 'Review the questions and click "Create Session" when ready'
  }
];

export default function CreateQuizPage() {
  const { currentOnboardingStep, setOnboardingStep, isOnboardingComplete } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Show onboarding for quiz creation if user hasn't completed it
    if (!isOnboardingComplete && currentOnboardingStep === null) {
      setShowOnboarding(true);
      setOnboardingStep('quiz-creation');
    }
  }, [isOnboardingComplete, currentOnboardingStep, setOnboardingStep]);

  const handleQuizCreated = async (quiz: {
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
  } | undefined) => {
    console.log('Quiz created:', quiz)
    
    if (quiz) {
      try {
        // Create a session for this quiz
        const response = await fetch('/api/session/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quizId: quiz.id,
            hostId: 'anonymous-host', // This will be updated when auth is implemented
          }),
        })

        if (response.ok) {
          const { session } = await response.json()
          // Redirect to the session lobby as host
          window.location.href = `/play/${session.id}?isHost=true&hostId=${session.hostId}`
        } else {
          const error = await response.json()
          alert(`Failed to create session: ${error.error}`)
        }
      } catch (error) {
        console.error('Error creating session:', error)
        alert('Failed to create game session. Please try again.')
      }
    }
  }

  const handleOnboardingNext = () => {
    if (currentStep < quizCreationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleOnboardingPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setOnboardingStep(null);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setOnboardingStep(null);
  };

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
          <div className="flex items-center space-x-3">
            <Link href="/">
              <button className="glass-button px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </button>
            </Link>
            <Link href="/join">
              <button className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-full text-white font-medium transition-all duration-300 backdrop-blur-sm border border-white/30">
                Join Game
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Create a Quiz</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Generate trivia questions from Wikipedia articles or YouTube videos using AI
          </p>
        </div>
        
        <QuizGenerator onQuizCreated={handleQuizCreated} />
      </main>

      {/* Onboarding Overlay */}
      <OnboardingOverlay
        steps={quizCreationSteps}
        currentStep={currentStep}
        onNext={handleOnboardingNext}
        onPrevious={handleOnboardingPrevious}
        onSkip={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
        isActive={showOnboarding}
      />
    </div>
  )
}