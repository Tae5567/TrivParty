#!/usr/bin/env tsx

import { supabase } from '../src/lib/supabase'

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { error } = await supabase
      .from('quizzes')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1)
})