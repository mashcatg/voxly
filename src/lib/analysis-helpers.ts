export interface ConversationAnalysis {
  userAnalysis: {
    hesitations: {
      frequency: number;
      examples: string[];
    };
    grammarAndStructure: {
      score: number;
      issues: string[];
    };
    communicationStyle: {
      clarity: number;
      confidence: number;
      fluency: number;
    };
    improvements: {
      key: string;
      suggestions: string[];
    }[];
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

export async function generateCommunicationMetrics(model: any, messages: any[]): Promise<ConversationAnalysis> {
  const prompt = `Analyze this conversation and provide a detailed analysis in the following JSON format:
  {
    "userAnalysis": {
      "hesitations": { "frequency": 0.0-1.0, "examples": ["..."] },
      "grammarAndStructure": { "score": 0.0-1.0, "issues": ["..."] },
      "communicationStyle": {
        "clarity": 0.0-1.0,
        "confidence": 0.0-1.0,
        "fluency": 0.0-1.0
      },
      "improvements": [
        { "key": "...", "suggestions": ["..."] }
      ]
    },
    "conversationFlow": {
      "topicCoherence": 0.0-1.0,
      "turnTaking": 0.0-1.0,
      "pacing": { "score": 0.0-1.0, "notes": ["..."] }
    },
    "speechPatterns": {
      "fillers": { "frequency": 0.0-1.0, "examples": ["..."] },
      "vocabulary": {
        "diversity": 0.0-1.0,
        "level": "beginner|intermediate|advanced",
        "highlights": ["..."]
      }
    }
  }
  
  Ensure all numeric values are between 0 and 1. Provide specific examples and actionable feedback.`;
  
  try {
    const result = await model.generateContent(prompt + JSON.stringify(messages));
    const response = JSON.parse(result.response.text());
    
    // Validate and ensure all required fields exist
    if (!response.userAnalysis || !response.conversationFlow || !response.speechPatterns) {
      throw new Error('Invalid analysis format');
    }
    
    return response as ConversationAnalysis;
  } catch (error) {
    console.error('Error generating analysis:', error);
    // Return a default structure with zero values
    return {
      userAnalysis: {
        hesitations: { frequency: 0, examples: [] },
        grammarAndStructure: { score: 0, issues: [] },
        communicationStyle: { clarity: 0, confidence: 0, fluency: 0 },
        improvements: []
      },
      conversationFlow: {
        topicCoherence: 0,
        turnTaking: 0,
        pacing: { score: 0, notes: [] }
      },
      speechPatterns: {
        fillers: { frequency: 0, examples: [] },
        vocabulary: { diversity: 0, level: 'beginner', highlights: [] }
      }
    };
  }
}

// Add more specific analysis helpers as needed