import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'



// Mock dependencies at the top level
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

// Integration test with real-like data flow
describe('/api/quiz/generate - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle a complete quiz generation flow with realistic content', async () => {
    // Mock OpenAI response with realistic quiz data
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [
              {
                text: 'What is the capital city of France?',
                options: ['London', 'Paris', 'Berlin', 'Madrid'],
                correctAnswer: 'Paris',
                explanation: 'Paris is the capital and most populous city of France, located in the north-central part of the country.'
              },
              {
                text: 'Which river flows through Paris?',
                options: ['Thames', 'Seine', 'Rhine', 'Danube'],
                correctAnswer: 'Seine',
                explanation: 'The Seine is a major river in northern France that flows through Paris and empties into the English Channel.'
              },
              {
                text: 'What famous tower is located in Paris?',
                options: ['Big Ben', 'Eiffel Tower', 'Leaning Tower', 'CN Tower'],
                correctAnswer: 'Eiffel Tower',
                explanation: 'The Eiffel Tower is an iron lattice tower located on the Champ de Mars in Paris, built in 1889.'
              }
            ]
          })
        }
      }]
    }

    // Mock database responses
    const mockQuiz = {
      id: 'quiz-abc123',
      title: 'Paris Geography Quiz',
      source_url: 'https://en.wikipedia.org/wiki/Paris',
      created_at: '2024-01-01T12:00:00Z'
    }

    const mockQuestions = [
      {
        id: 'q1',
        quiz_id: 'quiz-abc123',
        text: 'What is the capital city of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correct_answer: 'Paris',
        explanation: 'Paris is the capital and most populous city of France, located in the north-central part of the country.',
        question_order: 1
      },
      {
        id: 'q2',
        quiz_id: 'quiz-abc123',
        text: 'Which river flows through Paris?',
        options: ['Thames', 'Seine', 'Rhine', 'Danube'],
        correct_answer: 'Seine',
        explanation: 'The Seine is a major river in northern France that flows through Paris and empties into the English Channel.',
        question_order: 2
      },
      {
        id: 'q3',
        quiz_id: 'quiz-abc123',
        text: 'What famous tower is located in Paris?',
        options: ['Big Ben', 'Eiffel Tower', 'Leaning Tower', 'CN Tower'],
        correct_answer: 'Eiffel Tower',
        explanation: 'The Eiffel Tower is an iron lattice tower located on the Champ de Mars in Paris, built in 1889.',
        question_order: 3
      }
    ]

    // Import mocked dependencies
    const { openai } = await import('@/lib/openai')
    const { createQuiz, validateGeneratedQuestions, createQuizGenerationPrompt } = await import('@/lib/quiz-generation')

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('Generate quiz about Paris...')
    vi.mocked(validateGeneratedQuestions).mockImplementation((questions) => questions)
    vi.mocked(createQuiz).mockResolvedValue({
      id: mockQuiz.id,
      title: mockQuiz.title,
      sourceUrl: mockQuiz.source_url,
      createdAt: mockQuiz.created_at,
      questions: mockQuestions.map(q => ({
        id: q.id,
        quizId: q.quiz_id,
        text: q.text,
        options: q.options as string[],
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        questionOrder: q.question_order
      }))
    })

    // Create realistic request
    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: `Paris is the capital and most populous city of France. With an official estimated population of 2,102,650 residents as of 1 January 2023 in an area of more than 105 km2 (41 sq mi), Paris is the fourth-most populated city in the European Union and the 30th most densely populated city in the world in 2022. Since the 17th century, Paris has been one of the world's major centres of finance, diplomacy, commerce, culture, fashion, and gastronomy. For its leading role in the arts and sciences, as well as its early and extensive system of street lighting, in the 19th century, it became known as the City of Light. The Seine river flows through the heart of Paris, dividing it into the Right Bank and Left Bank. The Eiffel Tower, built for the 1889 World's Fair, has become an iconic symbol of the city.`,
        questionCount: 3,
        title: 'Paris Geography Quiz'
      })
    })

    // Execute the request
    const response = await POST(request)
    const data = await response.json()

    // Verify response structure
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('quiz')
    expect(data.quiz).toHaveProperty('id')
    expect(data.quiz).toHaveProperty('title', 'Paris Geography Quiz')
    expect(data.quiz).toHaveProperty('questions')
    expect(data.quiz.questions).toHaveLength(3)

    // Verify question structure
    const firstQuestion = data.quiz.questions[0]
    expect(firstQuestion).toHaveProperty('id')
    expect(firstQuestion).toHaveProperty('text')
    expect(firstQuestion).toHaveProperty('options')
    expect(firstQuestion).toHaveProperty('correctAnswer')
    expect(firstQuestion).toHaveProperty('explanation')
    expect(firstQuestion.options).toHaveLength(4)
    expect(firstQuestion.options).toContain(firstQuestion.correctAnswer)

    // Verify all questions have proper structure
    data.quiz.questions.forEach((question: { text: string; options: string[]; correctAnswer: string; explanation: string }) => {
      expect(question.text).toBeTruthy()
      expect(Array.isArray(question.options)).toBe(true)
      expect(question.options).toHaveLength(4)
      expect(question.options).toContain(question.correctAnswer)
      expect(question.explanation).toBeTruthy()
    })

    // Verify function calls
    expect(createQuizGenerationPrompt).toHaveBeenCalledWith(expect.any(String), 3)
    expect(openai.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2000
    }))
    expect(validateGeneratedQuestions).toHaveBeenCalled()
    expect(createQuiz).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Paris Geography Quiz',
      questions: expect.any(Array)
    }))
  })

  it('should handle edge case with minimum content length', async () => {
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [{
              text: 'What is mentioned in the content?',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctAnswer: 'Option A',
              explanation: 'Based on the provided content.'
            }]
          })
        }
      }]
    }

    const { openai } = await import('@/lib/openai')
    const { createQuiz, validateGeneratedQuestions, createQuizGenerationPrompt } = await import('@/lib/quiz-generation')

    vi.mocked(openai.chat.completions.create).mockResolvedValue(mockOpenAIResponse as never)
    vi.mocked(createQuizGenerationPrompt).mockReturnValue('Generate quiz...')
    vi.mocked(validateGeneratedQuestions).mockImplementation((questions) => questions)
    vi.mocked(createQuiz).mockResolvedValue({
      id: 'quiz-min',
      title: 'Generated Quiz',
      sourceUrl: '',
      createdAt: '2024-01-01T12:00:00Z',
      questions: [{
        id: 'q1',
        quizId: 'quiz-min',
        text: 'What is mentioned in the content?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        explanation: 'Based on the provided content.',
        questionOrder: 1
      }]
    })

    // Minimum valid content (just over 100 characters)
    const minContent = 'This is a piece of content that contains enough information to generate meaningful quiz questions and tests.'

    const request = new NextRequest('http://localhost/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: minContent
        // Using default questionCount and title
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.quiz.questions).toHaveLength(1)
    expect(createQuizGenerationPrompt).toHaveBeenCalledWith(minContent, 5) // Default questionCount
  })
})