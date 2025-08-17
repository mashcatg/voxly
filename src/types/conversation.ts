export interface TranscriptMessage {
  role: string
  message: string
  time: number
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  mode: string
  assistant_id: string
  status: string
  transcript: any[]
  duration: number
  created_at: string
  updated_at: string
  last_message_at: string
  is_public: boolean
  vapi_call_id: string
}

export type Transcript = TranscriptMessage[]

export interface ConversationAnalytics {
  speakingTime: number
  turnCount: number
  responseRate: number
  clarity: number
  engagement: number
  sentiment: {
    positive: number
    neutral: number
    negative: number
  }
}

export interface Conversation {
  id: string
  title: string
  mode: 'conversation' | 'challenge'
  summary?: string | null
  transcript?: TranscriptMessage[] | null
  duration?: number | null
  created_at: string
  vapi_call_id?: string | null
  analytics?: ConversationAnalytics | null
  status?: 'active' | 'completed' | 'failed'
  assistant_id?: string
  user_id: string
}

export interface ConversationUpdate {
  id: string
  updates: Partial<Conversation>
}
