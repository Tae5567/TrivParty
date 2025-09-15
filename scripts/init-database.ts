#!/usr/bin/env tsx

import { supabase } from '../src/lib/supabase'

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing TrivParty database...')
    
    console.log('📝 Note: Database schema should be managed through Supabase migrations')
    console.log('This script will verify the database connection and table accessibility')
    
    // Test the setup by checking if tables exist
    console.log('🔍 Verifying database setup...')
    
    // Test each table individually with proper typing
    try {
      const { error: quizzesError } = await supabase
        .from('quizzes')
        .select('id')
        .limit(1)
      
      if (quizzesError) {
        console.error(`❌ Table 'quizzes' verification failed:`, quizzesError.message)
      } else {
        console.log(`✅ Table 'quizzes' is accessible`)
      }
    } catch (error) {
      console.error(`❌ Table 'quizzes' verification failed:`, error)
    }

    try {
      const { error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .limit(1)
      
      if (questionsError) {
        console.error(`❌ Table 'questions' verification failed:`, questionsError.message)
      } else {
        console.log(`✅ Table 'questions' is accessible`)
      }
    } catch (error) {
      console.error(`❌ Table 'questions' verification failed:`, error)
    }

    try {
      const { error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .limit(1)
      
      if (sessionsError) {
        console.error(`❌ Table 'sessions' verification failed:`, sessionsError.message)
      } else {
        console.log(`✅ Table 'sessions' is accessible`)
      }
    } catch (error) {
      console.error(`❌ Table 'sessions' verification failed:`, error)
    }

    try {
      const { error: playersError } = await supabase
        .from('players')
        .select('id')
        .limit(1)
      
      if (playersError) {
        console.error(`❌ Table 'players' verification failed:`, playersError.message)
      } else {
        console.log(`✅ Table 'players' is accessible`)
      }
    } catch (error) {
      console.error(`❌ Table 'players' verification failed:`, error)
    }

    try {
      const { error: playerAnswersError } = await supabase
        .from('player_answers')
        .select('id')
        .limit(1)
      
      if (playerAnswersError) {
        console.error(`❌ Table 'player_answers' verification failed:`, playerAnswersError.message)
      } else {
        console.log(`✅ Table 'player_answers' is accessible`)
      }
    } catch (error) {
      console.error(`❌ Table 'player_answers' verification failed:`, error)
    }
    
    console.log('🎉 Database verification completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Verify tables in your Supabase dashboard')
    console.log('2. Run database migrations if tables are missing')
    console.log('3. Start implementing content extraction features')
    
  } catch (error) {
    console.error('💥 Database verification failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
}

export { initializeDatabase }