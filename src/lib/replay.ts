import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'
import { 
  GameReplay, 
  CreateReplayData, 
  ShareReplayData, 
  ReplayPlayerScore, 
  ReplayQuestionResult 
} from '@/types/replay'

// Explicit type for the imported supabase client
type SupabaseClient = typeof supabase

export class ReplayService {
  private supabase: SupabaseClient

  constructor() {
    // ✅ reuse the singleton Supabase client
    this.supabase = supabase
  }

  /**
   * Generate a unique replay code
   */
  private async generateReplayCode(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_replay_code')
    
    if (error) {
      console.error('Error generating replay code:', error)
      // Fallback to client-side generation
      return this.generateClientReplayCode()
    }
    
    return data
  }

  /**
   * Fallback client-side replay code generation
   */
  private generateClientReplayCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Create a replay from completed session data
   */
  async createReplay(data: CreateReplayData): Promise<GameReplay | null> {
    try {
      const replayCode = await this.generateReplayCode()
      
      const { data: replay, error } = await this.supabase
        .from('game_replays')
        .insert({
          session_id: data.sessionId,
          replay_code: replayCode,
          title: data.title,
          quiz_title: data.quizTitle,
          total_questions: data.totalQuestions,
          total_players: data.totalPlayers,
          session_duration_seconds: data.sessionDurationSeconds,
          final_scores: data.finalScores,
          question_results: data.questionResults,
          is_public: data.isPublic ?? true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating replay:', error)
        return null
      }

      return this.mapDatabaseReplayToGameReplay(replay)
    } catch (error) {
      console.error('Error creating replay:', error)
      return null
    }
  }

  /**
   * Get replay by replay code
   */
  async getReplayByCode(replayCode: string): Promise<GameReplay | null> {
    try {
      const { data: replay, error } = await this.supabase
        .from('game_replays')
        .select('*')
        .eq('replay_code', replayCode)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error) {
        console.error('Error fetching replay:', error)
        return null
      }

      // Increment view count
      await this.incrementViewCount(replayCode)

      return this.mapDatabaseReplayToGameReplay(replay)
    } catch (error) {
      console.error('Error fetching replay:', error)
      return null
    }
  }

  /**
   * Increment replay view count
   */
  private async incrementViewCount(replayCode: string): Promise<void> {
    try {
      await this.supabase.rpc('increment_replay_views', {
        replay_code_param: replayCode
      })
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  /**
   * Record a replay share
   */
  async recordShare(data: ShareReplayData): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('replay_shares')
        .insert({
          replay_id: data.replayId,
          platform: data.platform,
          shared_by_ip: data.sharedByIp
        })

      if (error) {
        console.error('Error recording share:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error recording share:', error)
      return false
    }
  }

  /**
   * Generate replay data from completed session
   */
  async generateReplayFromSession(sessionId: string): Promise<CreateReplayData | null> {
    try {
      // Get session details
      const { data: session, error: sessionError } = await this.supabase
        .from('sessions')
        .select(`
          *,
          quizzes (
            title
          )
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError || !session) {
        console.error('Error fetching session:', sessionError)
        return null
      }

      // Get all players and their final scores
      const { data: players, error: playersError } = await this.supabase
        .from('players')
        .select('*')
        .eq('session_id', sessionId)
        .order('score', { ascending: false })

      if (playersError || !players) {
        console.error('Error fetching players:', playersError)
        return null
      }

      // Get all questions for this quiz
      const { data: questions, error: questionsError } = await this.supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', session.quiz_id)
        .order('question_order')

      if (questionsError || !questions) {
        console.error('Error fetching questions:', questionsError)
        return null
      }

      // Get all player answers
      const { data: playerAnswers, error: answersError } = await this.supabase
        .from('player_answers')
        .select(`
          *,
          players (
            nickname
          )
        `)
        .in('player_id', players.map(p => p.id))

      if (answersError) {
        console.error('Error fetching player answers:', answersError)
        return null
      }

      // Build final scores with rankings
      const finalScores: ReplayPlayerScore[] = players.map((player, index) => ({
        playerId: player.id,
        nickname: player.nickname,
        score: player.score,
        rank: index + 1,
        userId: player.user_id || undefined
      }))

      // Build question results
      const questionResults: ReplayQuestionResult[] = questions.map(question => {
        const questionAnswers = playerAnswers?.filter(answer => 
          answer.question_id === question.id
        ) || []

        return {
          questionId: question.id,
          questionText: question.text,
          options: Array.isArray(question.options) ? question.options as string[] : [],
          correctAnswer: question.correct_answer,
          explanation: question.explanation,
          questionOrder: question.question_order,
          playerAnswers: questionAnswers.map(answer => ({
            playerId: answer.player_id,
            nickname: (answer as any).players?.nickname || 'Unknown',
            selectedAnswer: answer.selected_answer,
            isCorrect: answer.is_correct,
            answeredAt: answer.answered_at
          }))
        }
      })

      // Calculate session duration (rough estimate)
      const sessionStart = new Date(session.created_at)
      const sessionEnd = new Date() // Assuming current time as end
      const durationSeconds = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000)

      return {
        sessionId,
        title: `${(session.quizzes as any)?.title || 'Quiz'} - ${new Date().toLocaleDateString()}`,
        quizTitle: (session.quizzes as any)?.title || 'Quiz',
        totalQuestions: questions.length,
        totalPlayers: players.length,
        sessionDurationSeconds: durationSeconds,
        finalScores,
        questionResults,
        isPublic: true
      }
    } catch (error) {
      console.error('Error generating replay from session:', error)
      return null
    }
  }

  /**
   * Map database replay to GameReplay type
   */
  private mapDatabaseReplayToGameReplay(dbReplay: Database['public']['Tables']['game_replays']['Row']): GameReplay {
    return {
      id: dbReplay.id,
      sessionId: dbReplay.session_id,
      replayCode: dbReplay.replay_code,
      title: dbReplay.title,
      quizTitle: dbReplay.quiz_title,
      totalQuestions: dbReplay.total_questions,
      totalPlayers: dbReplay.total_players,
      sessionDurationSeconds: dbReplay.session_duration_seconds || undefined,
      finalScores: Array.isArray(dbReplay.final_scores) ? dbReplay.final_scores as unknown as ReplayPlayerScore[] : [],
      questionResults: Array.isArray(dbReplay.question_results) ? dbReplay.question_results as unknown as ReplayQuestionResult[] : [],
      createdAt: dbReplay.created_at,
      expiresAt: dbReplay.expires_at,
      isPublic: dbReplay.is_public,
      viewCount: dbReplay.view_count
    }
  }

  /**
   * Generate shareable URL for replay
   */
  generateShareableUrl(replayCode: string, baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/replay/${replayCode}`
  }

  /**
   * Generate social sharing URLs
   */
  generateSocialShareUrls(replayCode: string, title: string, baseUrl?: string) {
    const shareUrl = this.generateShareableUrl(replayCode, baseUrl)
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(`Check out my TrivParty quiz results: ${title}`)
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    }
  }
}

// Export singleton instance
export const replayService = new ReplayService()