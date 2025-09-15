//src/lib/quiz-generation.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
import { Quiz } from '@/types'

export interface QuizCreationData {
  title: string
  sourceUrl: string
  questions: Array<{
    text: string
    options: string[]
    correctAnswer: string
    explanation: string
  }>
}

/**
 * Store a complete quiz with questions in the database
 */
export async function createQuiz(quizData: QuizCreationData): Promise<Quiz> {
  // Start a transaction by inserting quiz first
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      title: quizData.title,
      source_url: quizData.sourceUrl
    })
    .select()
    .single()

  if (quizError) {
    console.error('Failed to create quiz:', quizError)
    throw new Error('Failed to save quiz to database')
  }

  // Insert all questions
  const questionsToInsert = quizData.questions.map((question, index) => ({
    quiz_id: quiz.id,
    text: question.text,
    options: question.options,
    correct_answer: question.correctAnswer,
    explanation: question.explanation,
    question_order: index + 1
  }))

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)
    .select()

  if (questionsError) {
    console.error('Failed to create questions:', questionsError)
    // Clean up the quiz record on failure
    await supabase.from('quizzes').delete().eq('id', quiz.id)
    throw new Error('Failed to save questions to database')
  }

  // Return the complete quiz object
  return {
    id: quiz.id,
    title: quiz.title,
    sourceUrl: quiz.source_url,
    createdAt: quiz.created_at,
    questions: questions.map(q => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.text,
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      questionOrder: q.question_order
    }))
  }
}

/**
 * Retrieve a quiz with all its questions
 */
export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (quizError || !quiz) {
    return null
  }

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('question_order')

  if (questionsError) {
    console.error('Failed to fetch questions:', questionsError)
    return null
  }

  return {
    id: quiz.id,
    title: quiz.title,
    sourceUrl: quiz.source_url,
    createdAt: quiz.created_at,
    questions: questions.map(q => ({
      id: q.id,
      quizId: q.quiz_id,
      text: q.text,
      options: q.options as string[],
      correctAnswer: q.correct_answer,
      explanation: q.explanation,
      questionOrder: q.question_order
    }))
  }
}

/**
 * Validate that generated questions meet quality standards
 */
export function validateGeneratedQuestions(
  questions: Array<{
    text: string
    options: string[]
    correctAnswer: string
    explanation: string
  }>,
  sourceContent: string
): Array<{
  text: string
  options: string[]
  correctAnswer: string
  explanation: string
}> {
  return questions.filter(question => {
    // Check basic structure
    if (!question.text?.trim() || !question.correctAnswer?.trim() || !question.explanation?.trim()) {
      console.warn('Question missing required text fields:', question.text)
      return false
    }

    // Check options array
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      console.warn('Question must have exactly 4 options:', question.text)
      return false
    }

    // Check that all options are non-empty strings
    if (question.options.some(option => !option?.trim())) {
      console.warn('Question has empty options:', question.text)
      return false
    }

    // Check that correct answer exists in options
    if (!question.options.includes(question.correctAnswer)) {
      console.warn('Correct answer not found in options:', question.text)
      return false
    }

    // Check for duplicate options
    const uniqueOptions = new Set(question.options.map(opt => opt.trim().toLowerCase()))
    if (uniqueOptions.size !== 4) {
      console.warn('Question has duplicate options:', question.text)
      return false
    }

    // Basic content relevance check
    if (!isQuestionRelevantToContent(question.text, sourceContent)) {
      console.warn('Question appears unrelated to source content:', question.text)
      return false
    }

    return true
  })
}

/**
 * Check if a question is relevant to the source content
 */
function isQuestionRelevantToContent(questionText: string, sourceContent: string): boolean {
  // Extract meaningful words from the question (excluding common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'what', 'when', 'where', 'who', 'how', 'why', 'which', 'that', 'this', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'])
  
  const questionWords = questionText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))

  if (questionWords.length === 0) {
    return false
  }

  const contentLower = sourceContent.toLowerCase()
  
  // Check if at least 30% of meaningful words from the question appear in the content
  const foundWords = questionWords.filter(word => contentLower.includes(word))
  const relevanceRatio = foundWords.length / questionWords.length
  
  return relevanceRatio >= 0.3
}

/**
 * Generate a quiz prompt for OpenAI
 */
export function createQuizGenerationPrompt(content: string, questionCount: number): string {
  return `
Create ${questionCount} multiple-choice questions based on the following content. Each question should:

1. Be directly answerable from the provided content
2. Have exactly 4 answer options
3. Have one clearly correct answer that can be verified from the content
4. Include a brief explanation that references specific information from the content
5. Test understanding and comprehension, not just memorization
6. Cover different aspects and topics from the content when possible

Content:
${content}

Respond with valid JSON in this exact format:
{
  "questions": [
    {
      "text": "What is the main topic discussed in the content?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option B",
      "explanation": "According to the content, the main topic is X because..."
    }
  ]
}

Requirements:
- The correctAnswer must exactly match one of the options
- Each option should be plausible but only one should be correct
- Explanations should reference specific details from the content
- Questions should be clear and unambiguous
- Avoid questions that require external knowledge not in the content
`.trim()
}