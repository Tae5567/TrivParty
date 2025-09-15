'use client'

import { useState } from 'react'
import { URLInputForm } from './URLInputForm'
import { QuizPreview } from './QuizPreview'
import { Tooltip } from './ui/Tooltip'
import { ContentExtractionResponse, QuizGenerationResponse } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizGeneratorState {
  step: 'input' | 'extracting' | 'generating' | 'preview'
  extractedContent?: ContentExtractionResponse & { sourceUrl: string }
  generatedQuiz?: QuizGenerationResponse['quiz'] & { sourceUrl: string; title: string }
  error?: string | null
}

interface QuizGeneratorProps {
  onQuizCreated?: (quiz: QuizGeneratorState['generatedQuiz']) => void
}

export function QuizGenerator({ onQuizCreated }: QuizGeneratorProps) {
  const [state, setState] = useState<QuizGeneratorState>({
    step: 'input'
  })

  const extractContent = async (url: string, source: 'wikipedia' | 'youtube') => {
    setState(prev => ({ ...prev, step: 'extracting', error: null }))

    try {
      const endpoint = source === 'wikipedia'
        ? '/api/content/wikipedia'
        : '/api/content/youtube'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to extract content from ${source}`)
      }

      const data = await response.json()

      // Normalize the response format
      const extractedContent = {
        content: source === 'wikipedia' ? data.content : data.transcript,
        title: data.title,
        sourceUrl: url
      }

      // Validate content length
      if (!extractedContent.content || extractedContent.content.trim().length < 100) {
        throw new Error('Content is too short to generate meaningful quiz questions. Please try a different source.')
      }

      setState(prev => ({
        ...prev,
        extractedContent,
        step: 'generating'
      }))

      // Automatically proceed to quiz generation
      await generateQuiz(extractedContent)

    } catch (error) {
      console.error('Content extraction error:', error)
      setState(prev => ({
        ...prev,
        step: 'input',
        error: error instanceof Error ? error.message : 'Failed to extract content'
      }))
    }
  }

  const generateQuiz = async (extractedContent: QuizGeneratorState['extractedContent']) => {
    if (!extractedContent) return

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: extractedContent.content,
          title: extractedContent.title,
          questionCount: 15
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate quiz')
      }

      const data: QuizGenerationResponse = await response.json()

      const generatedQuiz = {
        ...data.quiz,
        sourceUrl: extractedContent.sourceUrl,
        title: extractedContent.title
      }

      setState(prev => ({
        ...prev,
        generatedQuiz,
        step: 'preview',
        error: null
      }))

    } catch (error) {
      console.error('Quiz generation error:', error)
      setState(prev => ({
        ...prev,
        step: 'input',
        error: error instanceof Error ? error.message : 'Failed to generate quiz'
      }))
    }
  }

  const handleStartOver = () => {
    setState({
      step: 'input',
      extractedContent: undefined,
      generatedQuiz: undefined,
      error: null
    })
  }

  const handleUseQuiz = () => {
    if (state.generatedQuiz && onQuizCreated) {
      onQuizCreated(state.generatedQuiz)
    }
  }

  const isLoading = state.step === 'extracting' || state.step === 'generating'

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {state.step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <URLInputForm
              onSubmit={extractContent}
              isLoading={isLoading}
              error={state.error}
            />
          </motion.div>
        )}

        {(state.step === 'extracting' || state.step === 'generating') && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="text-center py-12"
          >
            <div className="space-y-4">
              <motion.div 
                className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <motion.h3 
                  className="text-lg font-semibold"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {state.step === 'extracting' ? 'Extracting Content...' : 'Generating Quiz...'}
                </motion.h3>
                <motion.p 
                  className="text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  {state.step === 'extracting'
                    ? 'Fetching content from the provided URL'
                    : 'Creating trivia questions using AI'
                  }
                </motion.p>
              </motion.div>
              
              {/* Progress dots animation */}
              <motion.div 
                className="flex justify-center space-x-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {state.step === 'preview' && state.generatedQuiz && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <QuizPreview
              quiz={state.generatedQuiz}
              onStartOver={handleStartOver}
              onUseQuiz={handleUseQuiz}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}