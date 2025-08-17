export interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}

export interface TranscriptMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: number
}

export interface CallStatus {
  state: 'queued' | 'connecting' | 'active' | 'completed' | null
  startedAt?: string
  duration?: number
}
