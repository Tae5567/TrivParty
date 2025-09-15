import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReplayService } from '@/lib/replay'
import { CreateReplayData, GameReplay } from '@/types/replay'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    from: vi.fn(),
    rpc: vi.fn(),
  })
}))

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockEq = vi.fn()
const mockGt = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockIn = vi.fn()

describe('ReplayService', () => {
  let replayService: ReplayService

  beforeEach(() => {
    vi.clearAllMocks()
    replayService = new ReplayService()
    
    // Get the mocked supabase instance
    const mockSupabase = (replayService as any).supabase
    
    // Setup default mock chain
    mockSupabase.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      eq: mockEq,
      gt: mockGt,
      single: mockSingle,
      order: mockOrder,
      in: mockIn
    })
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      gt: mockGt,
      single: mockSingle,
      order: mockOrder,
      in: mockIn
    })
    
    mockInsert.mockReturnValue({
      select: mockSelect,
      single: mockSingle
    })
    
    mockEq.mockReturnValue({
      eq: mockEq,
      gt: mockGt,
      single: mockSingle,
      order: mockOrder,
      in: mockIn
    })
    
    mockGt.mockReturnValue({
      single: mockSingle
    })
    
    mockOrder.mockReturnValue({
      eq: mockEq,
      in: mockIn
    })
    
    mockIn.mockReturnValue({
      order: mockOrder
    })
  })

  describe('createReplay', () => {
    it('should create a replay successfully', async () => {
      const mockReplayData: CreateReplayData = {
        sessionId: 'session-123',
        title: 'Test Quiz Replay',
        quizTitle: 'Test Quiz',
        totalQuestions: 5,
        totalPlayers: 3,
        sessionDurationSeconds: 300,
        finalScores: [
          { playerId: 'player-1', nickname: 'Alice', score: 400, rank: 1 },
          { playerId: 'player-2', nickname: 'Bob', score: 300, rank: 2 },
          { playerId: 'player-3', nickname: 'Charlie', score: 200, rank: 3 }
        ],
        questionResults: [
          {
            questionId: 'q1',
            questionText: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            explanation: 'Basic math',
            questionOrder: 1,
            playerAnswers: [
              { playerId: 'player-1', nickname: 'Alice', selectedAnswer: '4', isCorrect: true, answeredAt: '2023-01-01T00:00:00Z' }
            ]
          }
        ],
        isPublic: true
      }

      const mockDbReplay = {
        id: 'replay-123',
        session_id: 'session-123',
        replay_code: 'ABC12345',
        title: 'Test Quiz Replay',
        quiz_title: 'Test Quiz',
        total_questions: 5,
        total_players: 3,
        session_duration_seconds: 300,
        final_scores: mockReplayData.finalScores,
        question_results: mockReplayData.questionResults,
        created_at: '2023-01-01T00:00:00Z',
        expires_at: '2023-02-01T00:00:00Z',
        is_public: true,
        view_count: 0
      }

      const mockSupabase = (replayService as any).supabase
      mockSupabase.rpc.mockResolvedValue({ data: 'ABC12345', error: null })
      mockSingle.mockResolvedValue({ data: mockDbReplay, error: null })

      const result = await replayService.createReplay(mockReplayData)

      expect(result).toBeDefined()
      expect(result?.replayCode).toBe('ABC12345')
      expect(result?.title).toBe('Test Quiz Replay')
      expect(mockSupabase.from).toHaveBeenCalledWith('game_replays')
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        session_id: 'session-123',
        replay_code: 'ABC12345',
        title: 'Test Quiz Replay'
      }))
    })

    it('should handle creation errors gracefully', async () => {
      const mockReplayData: CreateReplayData = {
        sessionId: 'session-123',
        title: 'Test Quiz Replay',
        quizTitle: 'Test Quiz',
        totalQuestions: 5,
        totalPlayers: 3,
        finalScores: [],
        questionResults: []
      }

      const mockSupabase = (replayService as any).supabase
      mockSupabase.rpc.mockResolvedValue({ data: 'ABC12345', error: null })
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      const result = await replayService.createReplay(mockReplayData)

      expect(result).toBeNull()
    })
  })

  describe('getReplayByCode', () => {
    it('should fetch replay by code successfully', async () => {
      const mockDbReplay = {
        id: 'replay-123',
        session_id: 'session-123',
        replay_code: 'ABC12345',
        title: 'Test Quiz Replay',
        quiz_title: 'Test Quiz',
        total_questions: 5,
        total_players: 3,
        session_duration_seconds: 300,
        final_scores: [],
        question_results: [],
        created_at: '2023-01-01T00:00:00Z',
        expires_at: '2023-02-01T00:00:00Z',
        is_public: true,
        view_count: 0
      }

      const mockSupabase = (replayService as any).supabase
      mockSingle.mockResolvedValue({ data: mockDbReplay, error: null })
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null })

      const result = await replayService.getReplayByCode('ABC12345')

      expect(result).toBeDefined()
      expect(result?.replayCode).toBe('ABC12345')
      expect(mockSupabase.from).toHaveBeenCalledWith('game_replays')
      expect(mockEq).toHaveBeenCalledWith('replay_code', 'ABC12345')
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_replay_views', {
        replay_code_param: 'ABC12345'
      })
    })

    it('should return null for non-existent replay', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const result = await replayService.getReplayByCode('INVALID')

      expect(result).toBeNull()
    })
  })

  describe('generateReplayFromSession', () => {
    it('should generate replay data from session', async () => {
      const mockSession = {
        id: 'session-123',
        quiz_id: 'quiz-123',
        created_at: '2023-01-01T00:00:00Z',
        quizzes: { title: 'Test Quiz' }
      }

      const mockPlayers = [
        { id: 'player-1', nickname: 'Alice', score: 400, user_id: null },
        { id: 'player-2', nickname: 'Bob', score: 300, user_id: null }
      ]

      const mockQuestions = [
        {
          id: 'q1',
          text: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correct_answer: '4',
          explanation: 'Basic math',
          question_order: 1
        }
      ]

      const mockAnswers = [
        {
          id: 'answer-1',
          player_id: 'player-1',
          question_id: 'q1',
          selected_answer: '4',
          is_correct: true,
          answered_at: '2023-01-01T00:01:00Z',
          players: { nickname: 'Alice' }
        }
      ]

      // Mock the chain of database calls
      mockSingle
        .mockResolvedValueOnce({ data: mockSession, error: null })
        .mockResolvedValueOnce({ data: mockPlayers, error: null })
        .mockResolvedValueOnce({ data: mockQuestions, error: null })
        .mockResolvedValueOnce({ data: mockAnswers, error: null })

      const result = await replayService.generateReplayFromSession('session-123')

      expect(result).toBeDefined()
      expect(result?.sessionId).toBe('session-123')
      expect(result?.quizTitle).toBe('Test Quiz')
      expect(result?.totalPlayers).toBe(2)
      expect(result?.totalQuestions).toBe(1)
      expect(result?.finalScores).toHaveLength(2)
      expect(result?.questionResults).toHaveLength(1)
    })

    it('should handle missing session gracefully', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } })

      const result = await replayService.generateReplayFromSession('invalid-session')

      expect(result).toBeNull()
    })
  })

  describe('recordShare', () => {
    it('should record share successfully', async () => {
      const mockSupabase = (replayService as unknown).supabase
      mockInsert.mockResolvedValue({ error: null })

      const result = await replayService.recordShare({
        replayId: 'replay-123',
        platform: 'twitter',
        sharedByIp: '192.168.1.1'
      })

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('replay_shares')
      expect(mockInsert).toHaveBeenCalledWith({
        replay_id: 'replay-123',
        platform: 'twitter',
        shared_by_ip: '192.168.1.1'
      })
    })

    it('should handle share recording errors', async () => {
      mockInsert.mockResolvedValue({ error: { message: 'Database error' } })

      const result = await replayService.recordShare({
        replayId: 'replay-123',
        platform: 'twitter'
      })

      expect(result).toBe(false)
    })
  })

  describe('generateShareableUrl', () => {
    it('should generate correct shareable URL', () => {
      const url = replayService.generateShareableUrl('ABC12345', 'https://example.com')
      expect(url).toBe('https://example.com/replay/ABC12345')
    })
  })

  describe('generateSocialShareUrls', () => {
    it('should generate social media share URLs', () => {
      const urls = replayService.generateSocialShareUrls('ABC12345', 'Test Quiz', 'https://example.com')
      
      expect(urls.twitter).toContain('twitter.com/intent/tweet')
      expect(urls.facebook).toContain('facebook.com/sharer')
      expect(urls.linkedin).toContain('linkedin.com/sharing')
      expect(urls.twitter).toContain(encodeURIComponent('https://example.com/replay/ABC12345'))
    })
  })
})