export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string
          source_url: string
          title: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          source_url: string
          title: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          source_url?: string
          title?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          quiz_id: string
          text: string
          options: Json
          correct_answer: string
          explanation: string
          question_order: number
        }
        Insert: {
          id?: string
          quiz_id: string
          text: string
          options: Json
          correct_answer: string
          explanation: string
          question_order: number
        }
        Update: {
          id?: string
          quiz_id?: string
          text?: string
          options?: Json
          correct_answer?: string
          explanation?: string
          question_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: {
          id: string
          quiz_id: string
          host_id: string
          join_code: string
          status: string
          current_question_id: string | null
          created_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          quiz_id: string
          host_id: string
          join_code: string
          status?: string
          current_question_id?: string | null
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          quiz_id?: string
          host_id?: string
          join_code?: string
          status?: string
          current_question_id?: string | null
          created_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_current_question_id_fkey"
            columns: ["current_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      players: {
        Row: {
          id: string
          session_id: string
          nickname: string
          score: number
          joined_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          session_id: string
          nickname: string
          score?: number
          joined_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          nickname?: string
          score?: number
          joined_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      player_answers: {
        Row: {
          id: string
          player_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          player_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          question_id?: string
          selected_answer?: string
          is_correct?: boolean
          answered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          total_games_played: number
          total_correct_answers: number
          total_questions_answered: number
          best_streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          total_games_played?: number
          total_correct_answers?: number
          total_questions_answered?: number
          best_streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          total_games_played?: number
          total_correct_answers?: number
          total_questions_answered?: number
          best_streak?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_game_history: {
        Row: {
          id: string
          user_id: string
          session_id: string
          final_score: number
          final_rank: number
          questions_answered: number
          correct_answers: number
          completion_time: string | null
          played_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          final_score: number
          final_rank: number
          questions_answered: number
          correct_answers: number
          completion_time?: string | null
          played_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          final_score?: number
          final_rank?: number
          questions_answered?: number
          correct_answers?: number
          completion_time?: string | null
          played_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_game_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_game_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      friendships: {
        Row: {
          id: string
          requester_id: string
          addressee_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          addressee_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          addressee_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_type: string
          achievement_data: Json | null
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_type: string
          achievement_data?: Json | null
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_type?: string
          achievement_data?: Json | null
          earned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      game_invitations: {
        Row: {
          id: string
          session_id: string
          inviter_id: string
          invitee_id: string
          status: string
          message: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          session_id: string
          inviter_id: string
          invitee_id: string
          status?: string
          message?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          inviter_id?: string
          invitee_id?: string
          status?: string
          message?: string | null
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_invitations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      power_ups: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          max_uses_per_game: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          max_uses_per_game?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          max_uses_per_game?: number
          created_at?: string
        }
        Relationships: []
      }
      player_power_ups: {
        Row: {
          id: string
          player_id: string
          power_up_id: string
          uses_remaining: number
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          power_up_id: string
          uses_remaining?: number
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          power_up_id?: string
          uses_remaining?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_power_ups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_power_ups_power_up_id_fkey"
            columns: ["power_up_id"]
            isOneToOne: false
            referencedRelation: "power_ups"
            referencedColumns: ["id"]
          }
        ]
      }
      power_up_usage: {
        Row: {
          id: string
          player_id: string
          power_up_id: string
          question_id: string
          used_at: string
        }
        Insert: {
          id?: string
          player_id: string
          power_up_id: string
          question_id: string
          used_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          power_up_id?: string
          question_id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_up_usage_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_power_up_id_fkey"
            columns: ["power_up_id"]
            isOneToOne: false
            referencedRelation: "power_ups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "power_up_usage_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      game_replays: {
        Row: {
          id: string
          session_id: string
          replay_code: string
          title: string
          quiz_title: string
          total_questions: number
          total_players: number
          session_duration_seconds: number | null
          final_scores: Json
          question_results: Json
          created_at: string
          expires_at: string
          is_public: boolean
          view_count: number
        }
        Insert: {
          id?: string
          session_id: string
          replay_code: string
          title: string
          quiz_title: string
          total_questions: number
          total_players: number
          session_duration_seconds?: number | null
          final_scores: Json
          question_results: Json
          created_at?: string
          expires_at?: string
          is_public?: boolean
          view_count?: number
        }
        Update: {
          id?: string
          session_id?: string
          replay_code?: string
          title?: string
          quiz_title?: string
          total_questions?: number
          total_players?: number
          session_duration_seconds?: number | null
          final_scores?: Json
          question_results?: Json
          created_at?: string
          expires_at?: string
          is_public?: boolean
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_replays_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      replay_shares: {
        Row: {
          id: string
          replay_id: string
          platform: string
          shared_at: string
          shared_by_ip: string | null
        }
        Insert: {
          id?: string
          replay_id: string
          platform: string
          shared_at?: string
          shared_by_ip?: string | null
        }
        Update: {
          id?: string
          replay_id?: string
          platform?: string
          shared_at?: string
          shared_by_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "replay_shares_replay_id_fkey"
            columns: ["replay_id"]
            isOneToOne: false
            referencedRelation: "game_replays"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_accuracy: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
      get_user_leaderboard_rank: {
        Args: {
          user_uuid: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}