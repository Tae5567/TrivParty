import type { Database } from './database'

// User profile types
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

// Game history types
export type UserGameHistory = Database['public']['Tables']['user_game_history']['Row']
export type UserGameHistoryInsert = Database['public']['Tables']['user_game_history']['Insert']

// Friendship types
export type Friendship = Database['public']['Tables']['friendships']['Row']
export type FriendshipInsert = Database['public']['Tables']['friendships']['Insert']
export type FriendshipUpdate = Database['public']['Tables']['friendships']['Update']

// Achievement types
export type UserAchievement = Database['public']['Tables']['user_achievements']['Row']
export type UserAchievementInsert = Database['public']['Tables']['user_achievements']['Insert']

// Game invitation types
export type GameInvitation = Database['public']['Tables']['game_invitations']['Row']
export type GameInvitationInsert = Database['public']['Tables']['game_invitations']['Insert']
export type GameInvitationUpdate = Database['public']['Tables']['game_invitations']['Update']

// Extended types with relationships
export interface UserProfileWithStats extends UserProfile {
  accuracy: number
  leaderboardRank: number | null
  recentGames: UserGameHistory[]
  achievements: UserAchievement[]
}

export interface FriendshipWithProfiles extends Friendship {
  requester: UserProfile
  addressee: UserProfile
}

export interface GameInvitationWithProfiles extends GameInvitation {
  inviter: UserProfile
  invitee: UserProfile
  session: {
    id: string
    quiz: {
      title: string
    }
  }
}

// Authentication context types
export interface AuthUser {
  id: string
  email?: string
  profile?: UserProfile
}

export interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: UserProfileUpdate) => Promise<void>
  refreshProfile: () => Promise<void>
}

// Achievement system types
export type AchievementType = 
  | 'first_game'
  | 'perfect_game'
  | 'speed_demon'
  | 'social_butterfly'
  | 'quiz_master'
  | 'streak_master'
  | 'comeback_kid'

export interface AchievementDefinition {
  type: AchievementType
  name: string
  description: string
  icon: string
  condition: (data: any) => boolean
}

// Friend system types
export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export interface FriendRequest {
  id: string
  requester: UserProfile
  status: FriendshipStatus
  createdAt: string
}

export interface Friend {
  id: string
  profile: UserProfile
  friendshipId: string
  friendsSince: string
}

// Game invitation types
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export interface GameInvitationRequest {
  sessionId: string
  inviteeId: string
  message?: string
}

// User statistics types
export interface UserStatistics {
  totalGamesPlayed: number
  totalCorrectAnswers: number
  totalQuestionsAnswered: number
  accuracy: number
  bestStreak: number
  averageScore: number
  favoriteCategories: string[]
  recentActivity: UserGameHistory[]
  leaderboardRank: number | null
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number
  user: UserProfile
  totalCorrectAnswers: number
  totalGamesPlayed: number
  accuracy: number
}

export interface GlobalLeaderboard {
  entries: LeaderboardEntry[]
  userRank: number | null
  totalUsers: number
}