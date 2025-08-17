export interface ConversationAnalysis {
  userAnalysis: {
    hesitations: {
      frequency: number;
      examples: string[];
    };
    grammarAndStructure: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    communicationStyle: {
      clarity: number;
      confidence: number;
      fluency: number;
      description: string;
    };
    improvements: Array<{
      key: string;
      suggestions: string[];
    }>;
  };
  conversationFlow: {
    topicCoherence: number;
    turnTaking: number;
    pacing: {
      score: number;
      notes: string[];
    };
  };
  speechPatterns: {
    fillers: {
      frequency: number;
      examples: string[];
    };
    vocabulary: {
      diversity: number;
      level: string;
      highlights: string[];
    };
  };
}
