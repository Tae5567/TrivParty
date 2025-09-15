import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

// Type for mocked OpenAI response
type MockOpenAIResponse = {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// Mock dependencies
vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  },
  QUIZ_GENERATION_CONFIG: {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000
  }
}))

vi.mock('@/lib/quiz-generation', () => ({
  createQuiz: vi.fn(),
  validateGeneratedQuestions: vi.fn(),
  createQuizGenerationPrompt: vi.fn()
}))

import { openai } from '@/lib/openai'
import { createQuiz, validateGeneratedQuestions, createQuizGenerationPrompt } from '@/lib/quiz-generation'

describe('/api/quiz/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockValidQuestions = [
    {
      text: 'What is the capital of France?',
      options: ['London', 'Paris', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.'
    },
    {
      text: 'Which river flows through Paris?',
      options: ['Thames', 'Seine', 'Rhine', 'Danube'],
      correctAnswer: 'Seine',
      explanation: 'The Seine river flows through the heart of Paris.'
    }
  ]

  const mockQuizResponse = {
    id: 'quiz-123',
    title: 'Test Quiz',
    sourceUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    questions: mockValidQuestions.map((q, i) => ({
      id: `question-${i}`,
      quizId: 'quiz-123',
      ...q,
      questionOrder: i + 1
    }))
  }

  it('should generate a quiz successfully with valid content', async () => {
    const mockOpenAIResponse: MockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ questions: mockValidQuestions })
        }
      }]
    }

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')
    vi.mocked(validateGeneratedQuestions).mockReturnValue(mockValidQuestions)
    vi.mocked(createQuiz).mockResolvedValue(mockQuizResponse)

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Paris is the capital of France. The Seine river flows through the city. It is known for the Eiffel Tower and many museums.',
        questionCount: 2,
        title: 'Test Quiz'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.quiz).toBeDefined()
    expect(data.quiz.id).toBe('quiz-123')
    expect(data.quiz.questions).toHaveLength(2)
    expect(data.quiz.questions[0].text).toBe('What is the capital of France?')
  })

  it('should reject content that is too short', async () => {
    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'Too short',
        questionCount: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Content must be at least 100 characters long')
  })

  it('should reject invalid question count', async () => {
    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.',
        questionCount: 25
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Question count must be between 1 and 20')
  })

  it('should handle OpenAI API failures', async () => {
    vi.mocked(openai.chat.completions.create).mockRejectedValue(new Error('OpenAI API error'))
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.',
        questionCount: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Internal server error')
  })

  it('should handle rate limiting errors', async () => {
    vi.mocked(openai.chat.completions.create).mockRejectedValue(new Error('rate limit exceeded'))
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.',
        questionCount: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toContain('AI service temporarily unavailable')
  })

  it('should handle invalid JSON response from OpenAI', async () => {
    const mockOpenAIResponse: MockOpenAIResponse = {
      choices: [{
        message: {
          content: 'Invalid JSON response'
        }
      }]
    }

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.',
        questionCount: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error).toContain('Failed to generate quiz')
  })

  it('should handle validation failures', async () => {
    const mockOpenAIResponse: MockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ questions: mockValidQuestions })
        }
      }]
    }

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')
    vi.mocked(validateGeneratedQuestions).mockReturnValue([]) // No valid questions

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.',
        questionCount: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(422)
    expect(data.error).toContain('Failed to generate valid questions')
  })

  it('should use default values for optional parameters', async () => {
    const mockOpenAIResponse: MockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ questions: mockValidQuestions })
        }
      }]
    }

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')
    vi.mocked(validateGeneratedQuestions).mockReturnValue(mockValidQuestions)
    vi.mocked(createQuiz).mockResolvedValue(mockQuizResponse)

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.'
        // No questionCount or title provided
      })
    })

    const response = await POST(request)
    
    expect(response.status).toBe(200)
    expect(createQuizGenerationPrompt).toHaveBeenCalledWith(expect.any(String), 5) // Default questionCount
    expect(createQuiz).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Generated Quiz' // Default title
    }))
  })

  it('should handle database storage failures', async () => {
    const mockOpenAIResponse: MockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({ questions: mockValidQuestions })
        }
      }]
    }

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('mock prompt')
    vi.mocked(validateGeneratedQuestions).mockReturnValue(mockValidQuestions)
    vi.mocked(createQuiz).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: 'This is a long enough piece of content that should be valid for quiz generation. It contains multiple sentences and enough information to create meaningful questions.',
        questionCount: 5
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Internal server error')
  })
})