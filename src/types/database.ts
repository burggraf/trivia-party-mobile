export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string;
          category: string;
          subcategory: string | null;
          difficulty: string;
          question: string;
          a: string; // correct answer
          b: string; // incorrect answer
          c: string; // incorrect answer
          d: string; // incorrect answer
          level: string | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          subcategory?: string | null;
          difficulty: string;
          question: string;
          a: string;
          b: string;
          c: string;
          d: string;
          level?: string | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          subcategory?: string | null;
          difficulty?: string;
          question?: string;
          a?: string;
          b?: string;
          c?: string;
          d?: string;
          level?: string | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      parties: {
        Row: {
          id: string;
          host_id: string;
          name: string;
          description: string | null;
          scheduled_date: string;
          status: 'draft' | 'active' | 'completed' | 'cancelled';
          join_code: string;
          max_teams: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          name: string;
          description?: string | null;
          scheduled_date: string;
          status?: 'draft' | 'active' | 'completed' | 'cancelled';
          join_code: string;
          max_teams?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          host_id?: string;
          name?: string;
          description?: string | null;
          scheduled_date?: string;
          status?: 'draft' | 'active' | 'completed' | 'cancelled';
          join_code?: string;
          max_teams?: number | null;
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
          team_id: string;
          team_name: string;
          score: number;
          rank: number;
        }[];
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
          selected_answer_param: 'a' | 'b' | 'c' | 'd';
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
