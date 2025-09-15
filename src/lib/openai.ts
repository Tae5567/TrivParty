import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('Missing OpenAI API key')
}

export const openai = new OpenAI({
  apiKey,
})

// Default model configuration for quiz generation
export const QUIZ_MODEL = 'gpt-4o-mini'
export const QUIZ_GENERATION_CONFIG = {
  model: QUIZ_MODEL,
  temperature: 0.7,
  max_tokens: 2000,
}