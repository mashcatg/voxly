// Get API key from environment
const getApiKey = (): string => {
  const key = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }
  return key;
};

export interface DeepseekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export enum AnalysisPart {
  UserAnalysis = "userAnalysis",
  ConversationFlow = "conversationFlow",
  SpeechPatterns = "speechPatterns"
}

// Configure DeepSeek client for conversation analysis
export async function generateWithDeepseek(prompt: string, part?: AnalysisPart): Promise<any> {
  try {
    let systemPrompt = "You are an AI communication coach. Respond with JSON following the exact structure provided.";
    if (part) {
      systemPrompt += ` Focus ONLY on the ${part} section of the analysis.`;
    }
    
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2000, // Reduced since we're doing partial analysis
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data: DeepseekResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in DeepSeek response');
    }

    try {
      // Try to parse as JSON first
      const jsonContent = JSON.parse(content);
      return jsonContent;
    } catch (parseError) {
      // If not JSON, return the raw content
      return content;
    }
  } catch (error) {
    console.error('Error generating content with DeepSeek:', error);
    throw error;
  }
}
