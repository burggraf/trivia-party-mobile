export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          category: string | null;
          subcategory: string | null;
          difficulty: string | null;
          question: string | null;
          a: string | null; // correct answer
          b: string | null; // incorrect answer
          c: string | null; // incorrect answer
          d: string | null; // incorrect answer
          level: number | null;
          metadata: Json | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          category?: string | null;
          subcategory?: string | null;
          difficulty?: string | null;
          question?: string | null;
          a?: string | null;
          b?: string | null;
          c?: string | null;
          d?: string | null;
          level?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          category?: string | null;
          subcategory?: string | null;
          difficulty?: string | null;
          question?: string | null;
          a?: string | null;
          b?: string | null;
          c?: string | null;
          d?: string | null;
          level?: number | null;
          metadata?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      parties: {
        Row: {
          id: string;
          host_id: string;
          name: string;
          description: string | null;
          scheduled_date: string;
          status: string | null;
          join_code: string;
          max_teams: number | null;
          current_round_id: string | null;
          current_question_order: number | null;
          game_state_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          name: string;
          description?: string | null;
          scheduled_date: string;
          status?: string | null;
          join_code: string;
          max_teams?: number | null;
          current_round_id?: string | null;
          current_question_order?: number | null;
          game_state_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          name?: string;
          description?: string | null;
          scheduled_date?: string;
          status?: string | null;
          join_code?: string;
          max_teams?: number | null;
          current_round_id?: string | null;
          current_question_order?: number | null;
          game_state_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          party_id: string;
          round_number: number;
          name: string;
          question_count: number;
          categories: string[];
          difficulty: string | null;
          status: 'pending' | 'active' | 'completed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          round_number: number;
          name: string;
          question_count: number;
          categories: string[];
          difficulty?: string | null;
          status?: 'pending' | 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          round_number?: number;
          name?: string;
          question_count?: number;
          categories?: string[];
          difficulty?: string | null;
          status?: 'pending' | 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          party_id: string;
          name: string;
          color: string | null;
          score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          name: string;
          color?: string | null;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          name?: string;
          color?: string | null;
          score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          user_id: string;
          party_id: string;
          team_id: string | null;
          display_name: string;
          is_host: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          party_id: string;
          team_id?: string | null;
          display_name: string;
          is_host?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          party_id?: string;
          team_id?: string | null;
          display_name?: string;
          is_host?: boolean;
          joined_at?: string;
        };
      };
      party_questions: {
        Row: {
          id: string;
          party_id: string;
          round_id: string;
          question_id: string; // TEXT type to match existing questions table
          question_order: number;
          points: number;
          time_limit: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          round_id: string;
          question_id: string; // TEXT type to match existing questions table
          question_order: number;
          points?: number;
          time_limit?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          round_id?: string;
          question_id?: string; // TEXT type to match existing questions table
          question_order?: number;
          points?: number;
          time_limit?: number | null;
          created_at?: string;
        };
      };
      answers: {
        Row: {
          id: string;
          party_question_id: string;
          team_id: string;
          selected_answer: 'a' | 'b' | 'c' | 'd';
          is_correct: boolean;
          answered_at: string;
        };
        Insert: {
          id?: string;
          party_question_id: string;
          team_id: string;
          selected_answer: 'a' | 'b' | 'c' | 'd';
          is_correct: boolean;
          answered_at?: string;
        };
        Update: {
          id?: string;
          party_question_id?: string;
          team_id?: string;
          selected_answer?: 'a' | 'b' | 'c' | 'd';
          is_correct?: boolean;
          answered_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_join_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      calculate_team_score: {
        Args: {
          team_uuid: string;
        };
        Returns: number;
      };
      get_party_leaderboard: {
        Args: {
          party_uuid: string;
        };
        Returns: {
          id: string;
          name: string;
          color: string;
          score: number;
          rank: number;
        }[];
      };
      get_enhanced_party_leaderboard: {
        Args: {
          party_uuid: string;
        };
        Returns: {
          team_id: string;
          team_name: string;
          team_color: string;
          total_score: number;
          round_scores: Json;
          total_questions: number;
          correct_answers: number;
          accuracy: number;
          rank: number;
        }[];
      };
      get_round_leaderboard: {
        Args: {
          party_uuid: string;
          round_number_param: number;
        };
        Returns: {
          team_id: string;
          team_name: string;
          team_color: string;
          round_score: number;
          round_questions: number;
          round_correct: number;
          round_accuracy: number;
          rank: number;
        }[];
      };
      get_team_analytics: {
        Args: {
          team_uuid: string;
        };
        Returns: {
          team_id: string;
          team_name: string;
          total_score: number;
          total_questions: number;
          correct_answers: number;
          accuracy: number;
          round_breakdown: Json;
        };
      };
      select_questions_for_round: {
        Args: {
          round_uuid: string;
          categories_array: string[];
          difficulty_level?: string;
          question_count_param?: number;
        };
        Returns: undefined;
      };
      all_teams_answered: {
        Args: {
          party_question_uuid: string;
        };
        Returns: boolean;
      };
      submit_team_answer: {
        Args: {
          party_question_uuid: string;
          team_uuid: string;
          selected_answer_param: string;
        };
        Returns: boolean;
      };
      is_party_host: {
        Args: {
          party_uuid: string;
          user_uuid: string;
        };
        Returns: boolean;
      };
      is_party_player: {
        Args: {
          party_uuid: string;
          user_uuid: string;
        };
        Returns: boolean;
      };
      is_team_member: {
        Args: {
          team_uuid: string;
          user_uuid: string;
        };
        Returns: boolean;
      };
      get_user_team_in_party: {
        Args: {
          party_uuid: string;
          user_uuid: string;
        };
        Returns: string;
      };
      has_party_access: {
        Args: {
          party_uuid: string;
          user_uuid: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
