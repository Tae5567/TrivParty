import { supabase } from '@/lib/supabase'
import type { AchievementDefinition, AchievementType, UserAchievementInsert } from '@/types/auth'

// Achievement definitions
export const ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
  first_game: {
    type: 'first_game',
    name: 'First Steps',
    description: 'Played your first trivia game',
    icon: '🎯',
    condition: (data: { gamesPlayed: number }) => data.gamesPlayed === 1,
  },
  perfect_game: {
    type: 'perfect_game',
    name: 'Perfect Score',
    description: 'Got all questions correct in a game',
    icon: '💯',
    condition: (data: { correctAnswers: number; totalQuestions: number }) => 
      data.totalQuestions > 0 && data.correctAnswers === data.totalQuestions,
  },
  speed_demon: {
    type: 'speed_demon',
    name: 'Speed Demon',
    description: 'Answered all questions in under 30 seconds total',
    icon: '⚡',
    condition: (data: { completionTime: number; totalQuestions: number }) => 
      data.totalQuestions > 0 && data.completionTime < 30000,
  },
  social_butterfly: {
    type: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Played with 10+ different people',
    icon: '🦋',
    condition: (data: { uniquePlayers: number }) => data.uniquePlayers >= 10,
  },
  quiz_master: {
    type: 'quiz_master',
    name: 'Quiz Master',
    description: 'Created 5+ quizzes',
    icon: '👑',
    condition: (data: { quizzesCreated: number }) => data.quizzesCreated >= 5,
  },
  streak_master: {
    type: 'streak_master',
    name: 'Streak Master',
    description: 'Got 10+ questions correct in a row',
    icon: '🔥',
    condition: (data: { bestStreak: number }) => data.bestStreak >= 10,
  },
  comeback_kid: {
    type: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Won a game after being in last place',
    icon: '🚀',
    condition: (data: { wasLastPlace: boolean; finalRank: number }) => 
      data.wasLastPlace && data.finalRank === 1,
  },
}

// Check and award achievements for a user
export async function checkAndAwardAchievements(userId: string, gameData: any) {
  try {
    // Get user's current achievements
    const { data: existingAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_type')
      .eq('user_id', userId)

    const existingTypes = new Set(existingAchievements?.map(a => a.achievement_type) || [])

    // Get user statistics for achievement checking
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) return

    // Get additional data for achievements
    const { data: gameHistory } = await supabase
      .from('user_game_history')
      .select('*')
      .eq('user_id', userId)

    const { data: createdQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('created_by', userId)

    // Calculate unique players the user has played with
    const { data: playedSessions } = await supabase
      .from('players')
      .select('session_id')
      .eq('user_id', userId)

    let uniquePlayers = 0
    if (playedSessions) {
      const sessionIds = playedSessions.map(p => p.session_id)
      const { data: allPlayers } = await supabase
        .from('players')
        .select('user_id')
        .in('session_id', sessionIds)
        .neq('user_id', userId)

      uniquePlayers = new Set(allPlayers?.map(p => p.user_id).filter(Boolean)).size
    }

    // Prepare achievement check data
    const achievementData = {
      gamesPlayed: profile.total_games_played,
      correctAnswers: gameData.correctAnswers,
      totalQuestions: gameData.totalQuestions,
      completionTime: gameData.completionTime,
      uniquePlayers,
      quizzesCreated: createdQuizzes?.length || 0,
      bestStreak: profile.best_streak,
      wasLastPlace: gameData.wasLastPlace,
      finalRank: gameData.finalRank,
    }

    // Check each achievement
    const newAchievements: UserAchievementInsert[] = []

    for (const [type, definition] of Object.entries(ACHIEVEMENTS)) {
      if (!existingTypes.has(type) && definition.condition(achievementData)) {
        newAchievements.push({
          user_id: userId,
          achievement_type: type,
          achievement_data: gameData,
        })
      }
    }

    // Award new achievements
    if (newAchievements.length > 0) {
      const { error } = await supabase
        .from('user_achievements')
        .insert(newAchievements)

      if (error) {
        console.error('Error awarding achievements:', error)
      } else {
        console.log(`Awarded ${newAchievements.length} new achievements to user ${userId}`)
      }
    }

    return newAchievements.map(a => ACHIEVEMENTS[a.achievement_type as AchievementType])
  } catch (error) {
    console.error('Error checking achievements:', error)
    return []
  }
}

// Get user's achievements with definitions
export async function getUserAchievements(userId: string) {
  try {
    const { data: achievements, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('Error fetching achievements:', error)
      return []
    }

    return achievements?.map(achievement => ({
      ...achievement,
      definition: ACHIEVEMENTS[achievement.achievement_type as AchievementType],
    })) || []
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return []
  }
}

// Get achievement progress for a user
export async function getAchievementProgress(userId: string) {
  try {
    // Get user statistics
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) return {}

    // Get additional data
    const { data: createdQuizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('created_by', userId)

    const { data: playedSessions } = await supabase
      .from('players')
      .select('session_id')
      .eq('user_id', userId)

    let uniquePlayers = 0
    if (playedSessions) {
      const sessionIds = playedSessions.map(p => p.session_id)
      const { data: allPlayers } = await supabase
        .from('players')
        .select('user_id')
        .in('session_id', sessionIds)
        .neq('user_id', userId)

      uniquePlayers = new Set(allPlayers?.map(p => p.user_id).filter(Boolean)).size
    }

    return {
      gamesPlayed: profile.total_games_played,
      quizzesCreated: createdQuizzes?.length || 0,
      bestStreak: profile.best_streak,
      uniquePlayers,
      totalCorrectAnswers: profile.total_correct_answers,
    }
  } catch (error) {
    console.error('Error getting achievement progress:', error)
    return {}
  }
}