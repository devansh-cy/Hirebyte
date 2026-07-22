import { createClient } from '@supabase/supabase-js';

// Access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing! Check your frontend/.env file.');
}

// Create Supabase client - Use fallback values to prevent app crash if env vars are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
        };
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          role_title: string;
          job_description: string;
          resume_text: string;
          status: string;
          performance_score: number;
          feedback_json: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_title: string;
          job_description: string;
          resume_text: string;
          status?: string;
          performance_score?: number;
          feedback_json?: any;
          created_at?: string;
        };
      };
    };
  };
};

// Helper for Mock Data (used if no backend/Supabase connection)
export interface MockInterview {
  id: string;
  created_at: string;
  role_title: string;
  performance_score: number;
  status: 'completed' | 'in_progress' | 'interrupted';
}
