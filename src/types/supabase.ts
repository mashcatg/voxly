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
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          mode: string
          assistant_id: string | null
          vapi_call_id: string | null
          status: string
          summary: string | null
          transcript: string | null
          duration: number | null
          created_at: string
          updated_at: string
          last_message_at: string
          error_message: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          mode: string
          assistant_id?: string | null
          vapi_call_id?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          duration?: number | null
          created_at?: string
          updated_at?: string
          last_message_at?: string
          error_message?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          mode?: string
          assistant_id?: string | null
          vapi_call_id?: string | null
          status?: string
          summary?: string | null
          transcript?: string | null
          duration?: number | null
          created_at?: string
          updated_at?: string
          last_message_at?: string
          error_message?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
