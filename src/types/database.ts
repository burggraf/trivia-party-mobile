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
          question_id: string;
          question_order: number;
          points: number;
          time_limit: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          party_id: string;
          round_id: string;
          question_id: string;
          question_order: number;
          points?: number;
          time_limit?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          party_id?: string;
          round_id?: string;
          question_id?: string;
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
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
