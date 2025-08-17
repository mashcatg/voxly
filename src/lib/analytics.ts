const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function analyzeConversation(transcript: string) {
  const prompt = `Analyze this conversation transcript in detail and provide structured analytics. Focus on:

1. Voice Analytics:
- Filler words (um, uh, like, you know) usage with counts
- Speaking rate variations
- Volume levels and variations
- Tone variations

2. Content Quality:
- Grammar mistakes with corrections
- Sentence complexity
- Vocabulary richness
- Key topics discussed

3. Engagement:
- Number of questions asked
- Response latency
- Balance of interaction between participants

4. Overall Quality Metrics:
- Confidence score
- Clarity score
- Engagement score
- Fluency score

Return a JSON object with these exact keys:
{
  "fillerWords": [{ "word": string, "count": number, "timestamps": number[] }],
  "speakingRate": number[],
  "volumeLevels": number[],
  "toneVariation": number[],
  "grammarMistakes": [{ 
    "error": string,
    "suggestion": string,
    "context": string
  }],
  "sentenceComplexity": number,
  "vocabularyRichness": number,
  "questionCount": number,
  "responseLatency": number[],
  "interactionBalance": number,
  "confidenceScore": number,
  "clarityScore": number,
  "engagementScore": number,
  "fluencyScore": number
}

Here's the transcript to analyze:

${transcript}`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.candidates[0]?.content.parts[0].text;
    
    // Parse the JSON response from the text
    const startIndex = analysisText.indexOf('{');
    const endIndex = analysisText.lastIndexOf('}');
    const jsonStr = analysisText.substring(startIndex, endIndex + 1);
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    throw error;
  }
}
