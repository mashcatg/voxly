export interface Message {
  role: 'user' | 'assistant'
  message: string
  time: string
}

export interface ConversationStates {
  userAnalysis: {
    hesitations: {
      count: number
      instances: string[]
      frequency: string
      impact: string
      detailedAnalysis: {
        types: {
          fillers: number
          hesitations: number
          repetitions: number
        }
        severity: 'High' | 'Medium' | 'Low'
        improvementPriority: string
      }
    }
    grammarAndStructure: {
      score: number
      issues: string[]
      suggestions: string[]
    }
    communicationStyle: {
      clarity: number
      confidence: number
      fluency: number
      description: string
    }
    improvements: {
      immediate: string[]
      longTerm: string[]
    }
  }
  conversationFlow: {
    turnCount: number
    userResponseTimes: number[]
    averageTurnLength: number
    topicCoherence: number
    description: string
  }
  speechPatterns: {
    fillers: {
      words: string[]
      frequency: number
    }
    repetitions: string[]
    pacingMetrics: {
      hesitation_marker_count: number
    }
  }
  emotionalState: string[]
  mandatoryPhrasesUsed: string[]
  callDurationSegments: Array<{
    topic: string
    duration: number
  }>
}

export interface ConversationDetails {
  id: string
  transcript: string
  summary: string
  recordingUrl: string
  analysis: any
  duration: number
  states: ConversationStates | null
  messages: Message[]
  vapi_call_id?: string
  artifact: {
    recording: {
      stereoUrl: string
      mono: {
        combinedUrl: string
        assistantUrl: string
        customerUrl: string
      }
    }
  }
}
