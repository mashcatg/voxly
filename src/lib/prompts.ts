export function constructAnalysisPrompt(transcript: string): string {
  return `You are an expert AI communication coach specializing in detailed conversation analysis. Analyze this transcript and provide a comprehensive evaluation in the following JSON format. DO NOT include any markdown formatting or code blocks. Return ONLY the raw JSON object.

Your task: Analyze this conversation for communication patterns, effectiveness, and areas of improvement. Focus on specific metrics and provide actionable insights.

Conversation Transcript:
${transcript}

Return a JSON object with the following structure (replace the example values with your analysis):
{
  "userAnalysis": {
    "hesitations": {
      "count": 0,
      "instances": [],
      "impact": ""
    },
    "grammarAndStructure": {
      "score": 0.0,
      "issues": [],
      "suggestions": []
    },
    "communicationStyle": {
      "clarity": 0.0,
      "confidence": 0.0,
      "fluency": 0.0,
      "description": ""
    },
    "improvements": {
      "immediate": [],
      "longTerm": []
    }
  },
  "conversationFlow": {
    "turnCount": 0,
    "userResponseTimes": [],
    "averageTurnLength": 0,
    "topicCoherence": 0.0,
    "description": ""
  },
  "speechPatterns": {
    "fillers": {
      "words": [],
      "frequency": 0.0
    },
    "repetitions": [],
    "pacingMetrics": {
      "hesitation_marker_count": 0
    }
  },
  "emotionalState": [],
  "mandatoryPhrasesUsed": [],
  "callDurationSegments": []
}`
}
