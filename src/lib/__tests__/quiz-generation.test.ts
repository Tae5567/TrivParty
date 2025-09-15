import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  validateGeneratedQuestions, 
  createQuizGenerationPrompt,
  createQuiz,
  getQuiz
} from '../quiz-generation'

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn()
      }))
    }))
  }
}))

import { supabase } from '../supabase'

describe('Quiz Generation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateGeneratedQuestions', () => {
    const sourceContent = 'Paris is the capital of France. The Seine river flows through the city. The Eiffel Tower is a famous landmark.'

    it('should validate correct questions', () => {
      const questions = [
        {
          text: 'What is the capital of France?',
          options: ['London', 'Paris', 'Berlin', 'Madrid'],
          correctAnswer: 'Paris',
          explanation: 'Paris is the capital of France according to the text.'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(questions[0])
    })

    it('should reject questions with missing text', () => {
      const questions = [
        {
          text: '',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'Test explanation'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(0)
    })

    it('should reject questions with wrong number of options', () => {
      const questions = [
        {
          text: 'Test question?',
          options: ['A', 'B', 'C'], // Only 3 options
          correctAnswer: 'A',
          explanation: 'Test explanation'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(0)
    })

    it('should reject questions with empty options', () => {
      const questions = [
        {
          text: 'Test question?',
          options: ['A', '', 'C', 'D'],
          correctAnswer: 'A',
          explanation: 'Test explanation'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(0)
    })

    it('should reject questions where correct answer is not in options', () => {
      const questions = [
        {
          text: 'Test question?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'E', // Not in options
          explanation: 'Test explanation'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(0)
    })

    it('should reject questions with duplicate options', () => {
      const questions = [
        {
          text: 'Test question?',
          options: ['A', 'B', 'A', 'D'], // Duplicate 'A'
          correctAnswer: 'A',
          explanation: 'Test explanation'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(0)
    })

    it('should reject questions unrelated to content', () => {
      const questions = [
        {
          text: 'What programming language is used for quantum computing algorithms?', // Completely unrelated to Paris content
          options: ['Python', 'Qiskit', 'Q#', 'Cirq'],
          correctAnswer: 'Python',
          explanation: 'Python is commonly used for quantum computing.'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(0)
    })

    it('should handle mixed valid and invalid questions', () => {
      const questions = [
        {
          text: 'What is the capital of France?',
          options: ['London', 'Paris', 'Berlin', 'Madrid'],
          correctAnswer: 'Paris',
          explanation: 'Paris is the capital of France.'
        },
        {
          text: 'Invalid question',
          options: ['A', 'B'], // Wrong number of options
          correctAnswer: 'A',
          explanation: 'Invalid'
        },
        {
          text: 'Which river flows through Paris?',
          options: ['Thames', 'Seine', 'Rhine', 'Danube'],
          correctAnswer: 'Seine',
          explanation: 'The Seine flows through Paris.'
        }
      ]

      const result = validateGeneratedQuestions(questions, sourceContent)
      expect(result).toHaveLength(2)
      expect(result[0].text).toContain('capital of France')
      expect(result[1].text).toContain('river flows through Paris')
    })
  })

  describe('createQuizGenerationPrompt', () => {
    it('should create a proper prompt with content and question count', () => {
      const content = 'Test content about history'
      const questionCount = 5

      const prompt = createQuizGenerationPrompt(content, questionCount)

      expect(prompt).toContain('Create 5 multiple-choice questions')
      expect(prompt).toContain('Test content about history')
      expect(prompt).toContain('exactly 4 answer options')
      expect(prompt).toContain('JSON')
    })

    it('should include all required instructions', () => {
      const prompt = createQuizGenerationPrompt('content', 3)

      expect(prompt).toContain('directly answerable from the provided content')
      expect(prompt).toContain('correctAnswer must exactly match one of the options')
      expect(prompt).toContain('reference specific details from the content')
      expect(prompt).toContain('clear and unambiguous')
    })
  })

  describe('createQuiz', () => {
    it('should create a quiz with questions successfully', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        source_url: 'https://example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockQuestions = [
        {
          id: 'q1',
          quiz_id: 'quiz-123',
          text: 'Question 1?',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Explanation 1',
          question_order: 1
        }
      ]

      const mockSupabase = vi.mocked(supabase)
      
      // Create proper mock chain for quizzes
      const quizChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null })
          })
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn()
        })
      }

      // Create proper mock chain for questions
      const questionsChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: mockQuestions, error: null })
        })
      }

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'quizzes') {
          return quizChain
        } else if (table === 'questions') {
          return questionsChain
        }
        return {}
      })

      const quizData = {
        title: 'Test Quiz',
        sourceUrl: 'https://example.com',
        questions: [
          {
            text: 'Question 1?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            explanation: 'Explanation 1'
          }
        ]
      }

      const result = await createQuiz(quizData)

      expect(result.id).toBe('quiz-123')
      expect(result.title).toBe('Test Quiz')
      expect(result.questions).toHaveLength(1)
      expect(result.questions[0].text).toBe('Question 1?')
    })

    it('should handle quiz creation failure', async () => {
      const mockSupabase = vi.mocked(supabase)
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('DB Error') })
          })
        })
      })

      const quizData = {
        title: 'Test Quiz',
        sourceUrl: 'https://example.com',
        questions: []
      }

      await expect(createQuiz(quizData)).rejects.toThrow('Failed to save quiz to database')
    })

    it('should clean up quiz on questions creation failure', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        source_url: 'https://example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn()
      })

      const mockSupabase = vi.mocked(supabase)
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'quizzes') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null })
              })
            }),
            delete: mockDelete
          }
        } else if (table === 'questions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockResolvedValue({ data: null, error: new Error('Questions error') })
            })
          }
        }
        return {}
      })

      const quizData = {
        title: 'Test Quiz',
        sourceUrl: 'https://example.com',
        questions: [
          {
            text: 'Question 1?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            explanation: 'Explanation 1'
          }
        ]
      }

      await expect(createQuiz(quizData)).rejects.toThrow('Failed to save questions to database')
      expect(mockDelete).toHaveBeenCalled()
    })
  })

  describe('getQuiz', () => {
    it('should retrieve a quiz with questions', async () => {
      const mockQuiz = {
        id: 'quiz-123',
        title: 'Test Quiz',
        source_url: 'https://example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      const mockQuestions = [
        {
          id: 'q1',
          quiz_id: 'quiz-123',
          text: 'Question 1?',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          explanation: 'Explanation 1',
          question_order: 1
        }
      ]

      const mockSupabase = vi.mocked(supabase)
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'quizzes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockQuiz, error: null })
              })
            })
          }
        } else if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockQuestions, error: null })
              })
            })
          }
        }
        return {}
      })

      const result = await getQuiz('quiz-123')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('quiz-123')
      expect(result!.questions).toHaveLength(1)
      expect(result!.questions[0].text).toBe('Question 1?')
    })

    it('should return null for non-existent quiz', async () => {
      const mockSupabase = vi.mocked(supabase)
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
          })
        })
      })

      const result = await getQuiz('non-existent')
      expect(result).toBeNull()
    })
  })
})