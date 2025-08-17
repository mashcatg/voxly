import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { generateWithDeepseek } from '@/lib/deepseek-config'
import type { ConversationStates } from '@/types/conversation-states'

// Define request types
interface GenerateStatesRequest {
  conversationId: string
  transcript: string
}

// Helper function to check if an object has the required structure
function isValidAnalysisResult(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.userAnalysis &&
    typeof obj.userAnalysis === 'object' &&
    obj.userAnalysis.communicationStyle &&
    typeof obj.userAnalysis.communicationStyle === 'object' &&
    obj.userAnalysis.hesitations &&
    typeof obj.userAnalysis.hesitations === 'object' &&
    obj.userAnalysis.grammarAndStructure &&
    typeof obj.userAnalysis.grammarAndStructure === 'object'
  )
}

// Helper to create a base state structure
function createBaseState(): ConversationStates {
  return {
    userAnalysis: {
      hesitations: {
        count: 0,
        instances: [],
        impact: ''
      },
      grammarAndStructure: {
        score: 0,
        issues: [],
        suggestions: []
      },
      communicationStyle: {
        clarity: 0,
        confidence: 0,
        fluency: 0,
        description: ''
      },
      improvements: {
        immediate: [],
        longTerm: []
      }
    },
    conversationFlow: {
      turnCount: 0,
      userResponseTimes: [],
      averageTurnLength: 0,
      topicCoherence: 0,
      description: ''
    },
    speechPatterns: {
      fillers: {
        words: [],
        frequency: 0
      },
      repetitions: [],
      pacingMetrics: {
        hesitation_marker_count: 0
      }
    },
    emotionalState: [],
    mandatoryPhrasesUsed: [],
    callDurationSegments: []
  }
}

// Helper to normalize analysis results
function normalizeStates(states: any): ConversationStates {
  if (!states || typeof states !== 'object') {
    console.error('Invalid states object:', states)
    throw new Error('Failed to generate valid analysis')
  }

  const normalized = createBaseState()

  try {
    // Validate and normalize user analysis
    if (states.userAnalysis) {
      // Hesitations
      if (states.userAnalysis.hesitations) {
        normalized.userAnalysis.hesitations = {
          count: Math.max(0, parseInt(states.userAnalysis.hesitations.count) || 0),
          instances: Array.isArray(states.userAnalysis.hesitations.instances) 
            ? states.userAnalysis.hesitations.instances 
            : [],
          impact: states.userAnalysis.hesitations.impact || ''
        }
      }

      // Grammar and Structure
      if (states.userAnalysis.grammarAndStructure) {
        normalized.userAnalysis.grammarAndStructure = {
          score: Math.max(0, Math.min(1, parseFloat(states.userAnalysis.grammarAndStructure.score) || 0)),
          issues: Array.isArray(states.userAnalysis.grammarAndStructure.issues)
            ? states.userAnalysis.grammarAndStructure.issues
            : [],
          suggestions: Array.isArray(states.userAnalysis.grammarAndStructure.suggestions)
            ? states.userAnalysis.grammarAndStructure.suggestions
            : []
        }
      }

      // Communication Style
      if (states.userAnalysis.communicationStyle) {
        normalized.userAnalysis.communicationStyle = {
          clarity: Math.max(0, Math.min(1, parseFloat(states.userAnalysis.communicationStyle.clarity) || 0)),
          confidence: Math.max(0, Math.min(1, parseFloat(states.userAnalysis.communicationStyle.confidence) || 0)),
          fluency: Math.max(0, Math.min(1, parseFloat(states.userAnalysis.communicationStyle.fluency) || 0)),
          description: states.userAnalysis.communicationStyle.description || ''
        }
      }

      // Improvements
      if (states.userAnalysis.improvements) {
        normalized.userAnalysis.improvements = {
          immediate: Array.isArray(states.userAnalysis.improvements.immediate)
            ? states.userAnalysis.improvements.immediate
            : [],
          longTerm: Array.isArray(states.userAnalysis.improvements.longTerm)
            ? states.userAnalysis.improvements.longTerm
            : []
        }
      }
    }

    // Merge conversation flow
    if (states.conversationFlow) {
      Object.assign(normalized.conversationFlow, states.conversationFlow)
      normalized.conversationFlow.userResponseTimes = Array.isArray(states.conversationFlow.userResponseTimes)
        ? states.conversationFlow.userResponseTimes
        : []
    }

    // Merge speech patterns
    if (states.speechPatterns) {
      Object.assign(normalized.speechPatterns, states.speechPatterns)
      normalized.speechPatterns.fillers.words = Array.isArray(states.speechPatterns.fillers?.words)
        ? states.speechPatterns.fillers.words
        : []
      normalized.speechPatterns.repetitions = Array.isArray(states.speechPatterns.repetitions)
        ? states.speechPatterns.repetitions
        : []
    }

    // Ensure arrays
    normalized.userAnalysis.hesitations.instances = Array.isArray(states.userAnalysis?.hesitations?.instances) 
      ? states.userAnalysis.hesitations.instances 
      : []
    normalized.userAnalysis.grammarAndStructure.issues = Array.isArray(states.userAnalysis?.grammarAndStructure?.issues)
      ? states.userAnalysis.grammarAndStructure.issues
      : []
    normalized.userAnalysis.improvements.immediate = Array.isArray(states.userAnalysis?.improvements?.immediate)
      ? states.userAnalysis.improvements.immediate
      : []
    normalized.userAnalysis.improvements.longTerm = Array.isArray(states.userAnalysis?.improvements?.longTerm)
      ? states.userAnalysis.improvements.longTerm
      : []

    // Ensure arrays for optional fields
    normalized.emotionalState = Array.isArray(states.emotionalState) ? states.emotionalState : []
    normalized.mandatoryPhrasesUsed = Array.isArray(states.mandatoryPhrasesUsed) ? states.mandatoryPhrasesUsed : []
    normalized.callDurationSegments = Array.isArray(states.callDurationSegments) ? states.callDurationSegments : []

    // Ensure numbers are within valid ranges (0-1)
    normalized.userAnalysis.grammarAndStructure.score = Math.max(0, Math.min(1, Number(states.userAnalysis?.grammarAndStructure?.score) || 0))
    normalized.userAnalysis.communicationStyle.clarity = Math.max(0, Math.min(1, Number(states.userAnalysis?.communicationStyle?.clarity) || 0))
    normalized.userAnalysis.communicationStyle.confidence = Math.max(0, Math.min(1, Number(states.userAnalysis?.communicationStyle?.confidence) || 0))
    normalized.userAnalysis.communicationStyle.fluency = Math.max(0, Math.min(1, Number(states.userAnalysis?.communicationStyle?.fluency) || 0))
    normalized.conversationFlow.topicCoherence = Math.max(0, Math.min(1, Number(states.conversationFlow?.topicCoherence) || 0))

    // Ensure positive numbers
    normalized.userAnalysis.hesitations.count = Math.max(0, Number(states.userAnalysis?.hesitations?.count) || 0)
    normalized.conversationFlow.turnCount = Math.max(0, Number(states.conversationFlow?.turnCount) || 0)
    normalized.conversationFlow.averageTurnLength = Math.max(0, Number(states.conversationFlow?.averageTurnLength) || 0)
    normalized.speechPatterns.fillers.frequency = Math.max(0, Number(states.speechPatterns?.fillers?.frequency) || 0)
    normalized.speechPatterns.pacingMetrics.hesitation_marker_count = Math.max(0, Number(states.speechPatterns?.pacingMetrics?.hesitation_marker_count) || 0)

    return normalized
  } catch (error) {
    console.error('Error normalizing states:', error)
    throw new Error('Failed to normalize analysis results')
  }
}

interface DeepSeekArrayFeedback {
  feedback: string;
  suggestion: string;
  exercise: string;
}

interface DeepSeekObjectFeedback {
  acknowledgement?: string;
  clarification_request?: string;
  encouragement?: string;
  offer_for_assistance?: string;
}

interface DeepSeekResponse {
  response: DeepSeekArrayFeedback[] | DeepSeekObjectFeedback;
}

// Helper function to generate impact description
function generateHesitationImpact(hesitationCount: number, totalWords: number): string {
  const percentage = (hesitationCount / totalWords) * 100;
  
  if (percentage > 10) {
    return "High frequency of hesitations significantly impacts speech fluency. Consider focusing on reducing filler words to improve clarity and confidence.";
  } else if (percentage > 5) {
    return "Moderate use of hesitations occasionally affects speech flow. Some improvement in reducing filler words would enhance overall communication.";
  } else if (percentage > 2) {
    return "Low to moderate hesitation frequency. Speech is generally fluent with occasional use of filler words.";
  } else {
    return "Minimal hesitations detected. Speech pattern shows good fluency and confidence.";
  }
}

// Transform DeepSeek response into our expected format
function transformDeepSeekResponse(response: DeepSeekResponse): any {
  if (!response?.response) {
    console.error('Invalid DeepSeek response format:', response)
    throw new Error('Invalid response format from DeepSeek')
  }

  try {
    // Initialize feedback items array
    let feedbackItems: DeepSeekArrayFeedback[] = [];
    
    // Handle both array and object formats
    if (Array.isArray(response.response)) {
      // Array format with feedback, suggestion, exercise
      feedbackItems = response.response;
    } else {
      // Object format with acknowledgement, clarification, etc.
      const objResponse = response.response;
      
      // Convert object format to array format
      feedbackItems = [
        {
          feedback: objResponse.acknowledgement || '',
          suggestion: objResponse.clarification_request || '',
          exercise: objResponse.offer_for_assistance || ''
        }
      ];
      
      // Add encouragement as additional feedback if present
      if (objResponse.encouragement) {
        feedbackItems.push({
          feedback: objResponse.encouragement,
          suggestion: 'Keep practicing and maintaining a positive attitude.',
          exercise: 'Set small, achievable communication goals for each conversation.'
        });
      }
    }

  // Calculate detailed scores based on feedback content analysis
  const scores = {
    clarity: 0,
    confidence: 0,
    fluency: 0,
    grammar: 0,
    total: feedbackItems.length
  };

  // Analyze each feedback item for scoring
  feedbackItems.forEach(f => {
    const text = f.feedback.toLowerCase();
    
    // Clarity scoring
    if (text.includes('clear')) scores.clarity += text.includes('very clear') ? 2 : 1;
    if (text.includes('unclear')) scores.clarity -= 1;
    if (text.includes('confus')) scores.clarity -= 1;
    
    // Confidence scoring
    if (text.includes('confident')) scores.confidence += text.includes('very confident') ? 2 : 1;
    if (text.includes('hesita')) scores.confidence -= 1;
    if (text.includes('uncertain')) scores.confidence -= 1;
    
    // Fluency scoring
    if (text.includes('fluent')) scores.fluency += text.includes('very fluent') ? 2 : 1;
    if (text.includes('natural')) scores.fluency += 1;
    if (text.includes('stumbl')) scores.fluency -= 1;
    
    // Grammar scoring
    if (text.includes('grammar') && !text.includes('poor grammar')) scores.grammar += 1;
    if (text.includes('well structured')) scores.grammar += 1;
    if (text.includes('poor grammar')) scores.grammar -= 1;
    if (text.includes('incorrect')) scores.grammar -= 1;
  });

  // Normalize scores to 0-1 range
  const normalizeScore = (score: number) => Math.max(0, Math.min(1, (score + scores.total) / (scores.total * 2)));
  
  const clarityScore = normalizeScore(scores.clarity);
  const confidenceScore = normalizeScore(scores.confidence);
  const fluencyScore = normalizeScore(scores.fluency);
  const grammarScore = normalizeScore(scores.grammar);    // Extract improvement suggestions
    const immediateImprovements = feedbackItems
      .map(f => f.suggestion)
      .filter((s): s is string => Boolean(s));
    const longTermImprovements = feedbackItems
      .map(f => f.exercise)
      .filter((e): e is string => Boolean(e));

    // Analyze filler words and hesitations
    const detectedFillerWords = feedbackItems
      .filter(f => f.feedback.toLowerCase().includes('filler'))
      .map(f => {
          // Define common hesitation words
  const hesitationWords = ['uh', 'um', 'er', 'ah', 'like', 'hmm', 'uhh', 'umm', 'eh', 'erm'];
  
  // Extract hesitations from feedback and transcript
  const fillerWords = feedbackItems
    .flatMap(f => {
      // Extract words in quotes
      const quotedWords = (f.feedback.match(/['"](.+?)['"]|['"](.+?)['"] and ['"](.+?)['"]/g) || [])
        .map(m => m.replace(/['"]/g, '').trim());
      
      // Extract common hesitation words
      const words = f.feedback.toLowerCase().split(/\s+/);
      const hesitations = words.filter(w => hesitationWords.includes(w));
      
      return [...new Set([...quotedWords, ...hesitations])]; // Remove duplicates
    })
    .filter((word): word is string => Boolean(word));
        return matches ? matches.map(m => m.replace(/['"]/g, '').trim()) : [];
      })
      .flat()
      .filter((word): word is string => Boolean(word));

    // Calculate total words and detailed metrics
    const allWords = feedbackItems.flatMap(f => f.feedback.toLowerCase().split(/\s+/));
    const totalWords = allWords.length;
    
    // Build the transformed response
    return {
      userAnalysis: {
        hesitations: {
          count: detectedFillerWords.length,
          instances: detectedFillerWords,
          frequency: `${(detectedFillerWords.length / totalWords * 100).toFixed(2)}%`,
          impact: generateHesitationImpact(detectedFillerWords.length, totalWords),
          detailedAnalysis: {
            types: {
              fillers: detectedFillerWords.filter(w => ['like', 'you know', 'kind of', 'sort of'].includes(w)).length,
              hesitations: detectedFillerWords.filter(w => ['uh', 'um', 'er', 'ah'].includes(w)).length,
              repetitions: detectedFillerWords.filter(w => w.includes('...')).length
            },
            severity: detectedFillerWords.length > totalWords * 0.1 ? 'High' : 
                     detectedFillerWords.length > totalWords * 0.05 ? 'Medium' : 'Low',
            improvementPriority: detectedFillerWords.length > totalWords * 0.1 ? 'Immediate attention needed' :
                                detectedFillerWords.length > totalWords * 0.05 ? 'Consider improvement' : 'Maintain current level'
          }
        },
        grammarAndStructure: {
          score: grammarScore,
          issues: feedbackItems
            .filter(f => 
              f.feedback.toLowerCase().includes('structure') || 
              f.feedback.toLowerCase().includes('grammar')
            )
            .map(f => f.feedback),
          suggestions: feedbackItems
            .filter(f => 
              f.feedback.toLowerCase().includes('structure') || 
              f.feedback.toLowerCase().includes('grammar')
            )
            .map(f => f.suggestion)
        },
        communicationStyle: {
          clarity: clarityScore,
          confidence: confidenceScore,
          fluency: fluencyScore,
          description: feedbackItems.map(f => f.feedback).join(' ')
        },
        improvements: {
          immediate: immediateImprovements,
          longTerm: longTermImprovements
        }
      },
      conversationFlow: {
        turnCount: 1,
        userResponseTimes: [],
        averageTurnLength: 0,
        topicCoherence: clarityScore,
        description: feedbackItems.find(f => 
          f.feedback.toLowerCase().includes('conversation')
        )?.feedback || ''
      },
      speechPatterns: {
        fillers: {
          words: detectedFillerWords,
          frequency: detectedFillerWords.length
        },
        repetitions: [],
        pacingMetrics: {
          hesitation_marker_count: detectedFillerWords.length
        }
      },
      emotionalState: [],
      mandatoryPhrasesUsed: [],
      callDurationSegments: []
    };
  } catch (error) {
    console.error('Error transforming DeepSeek response:', error);
    throw new Error('Failed to transform DeepSeek response');
  }

  // Calculate scores based on feedback



}

// Analyze a conversation transcript
async function analyzeTranscript(transcript: string) {
  if (!transcript || typeof transcript !== 'string') {
    throw new Error('Invalid transcript format')
  }

  try {
    const result = await generateWithDeepseek(transcript)
    
    // Handle the result
    let rawAnalysisData: any
    if (typeof result === 'string') {
      // Remove any potential markdown markers
      const cleanResult = result.replace(/```(json)?/g, '').trim()
      try {
        rawAnalysisData = JSON.parse(cleanResult)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        throw new Error('Failed to parse analysis result')
      }
    } else {
      rawAnalysisData = result
    }

    // Transform the DeepSeek response into our expected format
    const analysisData = transformDeepSeekResponse(rawAnalysisData)
    
    // Validate the structure
    if (!isValidAnalysisResult(analysisData)) {
      console.error('Invalid analysis structure:', analysisData)
      throw new Error('Invalid analysis result structure')
    }

    return analysisData
  } catch (error) {
    console.error('Analysis generation error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to generate valid analysis')
  }
}

// Main API handler
export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check auth session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request and validate
    const requestData = await request.clone().json()
    const { conversationId, transcript } = requestData as GenerateStatesRequest
    
    if (!conversationId || !transcript) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: conversationId and transcript' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check existing analysis
    const { data: conversation } = await supabase
      .from('conversations')
      .select('stats')
      .eq('id', conversationId)
      .single()

    if (conversation?.stats) {
      return new Response(
        JSON.stringify({ states: conversation.stats }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate new analysis
    const analysisResult = await analyzeTranscript(transcript)
    const normalizedStates = normalizeStates(analysisResult)

    // Save to database
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ stats: normalizedStates })
      .eq('id', conversationId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ states: normalizedStates }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Route handler error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate analysis',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
