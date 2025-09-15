import { NextRequest, NextResponse } from 'next/server'
import { openai, QUIZ_GENERATION_CONFIG } from '@/lib/openai'
import { QuizGenerationRequest } from '@/types'
import { 
  createQuiz, 
  validateGeneratedQuestions, 
  createQuizGenerationPrompt 
} from '@/lib/quiz-generation'

interface GeneratedQuestion {
  text: string
  options: string[]
  correctAnswer: string
  explanation: string
}

interface OpenAIQuizResponse {
  questions: GeneratedQuestion[]
}

export async function POST(request: NextRequest) {
  try {
    const body: QuizGenerationRequest = await request.json()
    const { content, questionCount = 15, title = 'Generated Quiz' } = body

    // Validate input
    if (!content || content.trim().length < 100) {
      return NextResponse.json(
        { error: 'Content must be at least 100 characters long' },
        { status: 400 }
      )
    }

    if (questionCount < 1 || questionCount > 20) {
      return NextResponse.json(
        { error: 'Question count must be between 1 and 20' },
        { status: 400 }
      )
    }

    // Generate quiz using OpenAI
    const prompt = createQuizGenerationPrompt(content, questionCount)
    
    console.log('Generating quiz with OpenAI...')
    console.log('Content length:', content.length)
    console.log('Question count:', questionCount)
    
    const completion = await openai.chat.completions.create({
      ...QUIZ_GENERATION_CONFIG,
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator that creates engaging multiple-choice questions from provided content. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    
    console.log('OpenAI response received')

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse and validate OpenAI response
    let quizData: OpenAIQuizResponse
    try {
      console.log('Parsing OpenAI response...')
      quizData = JSON.parse(responseContent)
      console.log('Successfully parsed response, questions count:', quizData.questions?.length || 0)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', responseContent)
      console.error('Parse error:', parseError)
      throw new Error('Invalid response format from AI')
    }

    // Validate generated questions
    console.log('Validating generated questions...')
    const validatedQuestions = validateGeneratedQuestions(quizData.questions, content)
    console.log('Validated questions count:', validatedQuestions.length)
    
    if (validatedQuestions.length === 0) {
      console.error('No valid questions generated')
      return NextResponse.json(
        { error: 'Failed to generate valid questions from the provided content. Please try with different content or a longer source.' },
        { status: 422 }
      )
    }

    // Store quiz in database
    console.log('Storing quiz in database...')
    const quiz = await createQuiz({
      title,
      sourceUrl: '', // Will be set by the calling component
      questions: validatedQuestions
    })
    console.log('Quiz stored successfully with ID:', quiz.id)

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        questions: quiz.questions.map(q => ({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }))
      }
    })

  } catch (error) {
    console.error('Quiz generation error:', error)
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI service temporarily unavailable. Please try again later.' },
          { status: 429 }
        )
      }
      
      if (error.message.includes('Invalid response format')) {
        return NextResponse.json(
          { error: 'Failed to generate quiz. Please try with different content.' },
          { status: 422 }
        )
      }
      
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service configuration error. Please contact support.' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error during quiz generation. Please try again.' },
      { status: 500 }
    )
  }
}

