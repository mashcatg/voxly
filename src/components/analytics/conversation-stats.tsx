'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  LineChart,
  RadarChart,
  PieChart
} from '@tremor/react'
import {
  Brain,
  Timer,
  Volume2,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Mic,
  Gauge
} from 'lucide-react'

interface FillerWord {
  word: string
  count: number
  timestamps: number[]
}

interface ConversationStats {
  // Speech Recognition & Quality
  speechToTextConfidence: number
  wordRecognitionAccuracy: number
  intentRecognitionConfidence: number
  audioClarityScore: number
  backgroundNoiseLevel: number
  echoDistortionCount: number

  // Voice Characteristics
  speakingRateWPM: number
  pitchVariation: number
  energyLevel: 'low' | 'medium' | 'high'
  volumeLevels?: number[] // For visualization

  // Language & Content Quality
  sentimentScore: number
  emotionalState: string[]
  fillerWordsCount: number
  fillerWords?: FillerWord[] // For visualization
  overlapFrequency: number
  grammarScore: number
  vocabularyRichness: number
  sentenceComplexity: number
  repetitionRate: number
  jargonUsage: number
  clarityIndex: number
  grammarMistakes?: {
    error: string
    suggestion: string
    context: string
  }[]

  // Engagement & Compliance
  talkToListenRatio: number
  questionCount: number
  activeListeningCount: number
  responseDelay: number
  scriptCoverage: number
  mandatoryPhrasesUsed: string[]
  policyComplianceScore: number

  // Call Structure
  callDurationSegments: {
    topic: string
    duration: number
  }[]
}

export function ConversationAnalytics({ stats }: { stats: ConversationStats }) {
  const statsCards = [
    {
      title: "Speaking Rate",
      value: stats.speakingRateWPM,
      unit: "WPM",
      icon: Timer,
      target: { min: 120, max: 150 },
      status: stats.speakingRateWPM < 120 ? "down" : stats.speakingRateWPM > 150 ? "warning" : "up"
    },
    {
      title: "Clarity Score",
      value: Math.round(stats.clarityIndex * 10),
      unit: "/10",
      icon: Brain,
      status: stats.clarityIndex > 0.7 ? "up" : "down"
    },
    {
      title: "Questions Asked",
      value: stats.questionCount,
      unit: "",
      icon: MessageSquare,
      status: "neutral"
    },
    {
      title: "Grammar Accuracy",
      value: Math.round(stats.grammarScore * 100),
      unit: "%",
      icon: CheckCircle,
      status: stats.grammarScore > 0.8 ? "up" : "down"
    },
  ]

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">{stat.title}</p>
                  <div className="flex items-baseline">
                    <h3 className="text-2xl font-bold">
                      {stat.value}{stat.unit}
                    </h3>
                    {stat.status !== "neutral" && (
                      <span className={`ml-2 text-sm ${
                        stat.status === 'up' ? 'text-green-500' : 
                        stat.status === 'down' ? 'text-red-500' : 
                        'text-yellow-500'
                      }`}>
                        {stat.status === 'up' ? '↑' : stat.status === 'down' ? '↓' : '!'}
                      </span>
                    )}
                  </div>
                </div>
                <stat.icon className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Voice Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart
              data={[
                {
                  metric: "Recognition",
                  value: stats.speechToTextConfidence * 100
                },
                {
                  metric: "Clarity",
                  value: stats.audioClarityScore * 100
                },
                {
                  metric: "Background",
                  value: (1 - stats.backgroundNoiseLevel) * 100
                },
                {
                  metric: "Intent",
                  value: stats.intentRecognitionConfidence * 100
                },
                {
                  metric: "Grammar",
                  value: stats.grammarScore * 100
                }
              ]}
              index="metric"
              categories={["value"]}
              colors={["blue"]}
              valueFormatter={(value: number) => `${Math.round(value)}%`}
              height="h-72"
            />
          </CardContent>
        </Card>

        {/* Engagement Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                {
                  metric: "Active Listening",
                  count: stats.activeListeningCount
                },
                {
                  metric: "Questions",
                  count: stats.questionCount
                },
                {
                  metric: "Script Coverage",
                  count: Math.round(stats.scriptCoverage * 100)
                },
                {
                  metric: "Policy Score",
                  count: Math.round(stats.policyComplianceScore * 100)
                }
              ]}
              index="metric"
              categories={["count"]}
              colors={["rose"]}
              valueFormatter={(value: number) => String(value)}
              height="h-72"
            />
          </CardContent>
        </Card>

        {/* Call Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={stats.callDurationSegments.map((segment, idx) => ({
                segment: segment.topic,
                duration: segment.duration,
                cumulative: stats.callDurationSegments
                  .slice(0, idx + 1)
                  .reduce((acc, curr) => acc + curr.duration, 0)
              }))}
              index="segment"
              categories={["duration", "cumulative"]}
              colors={["indigo", "blue"]}
              valueFormatter={(value: number) => `${Math.round(value)}s`}
              height="h-72"
            />
          </CardContent>
        </Card>

        {/* Grammar Improvements */}
        {stats.grammarMistakes && stats.grammarMistakes.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Grammar Improvements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.grammarMistakes.map((mistake, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                    <div>
                      <p className="font-medium text-red-500/70 mb-1">{mistake.error}</p>
                      <p className="text-sm text-muted-foreground mb-2">{mistake.context}</p>
                      <p className="text-sm text-green-600">Suggestion: {mistake.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emotional State */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Conversation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Emotional States</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.emotionalState.map((emotion, i) => (
                    <Badge key={i} variant="secondary">{emotion}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">Mandatory Phrases</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.mandatoryPhrasesUsed.map((phrase, i) => (
                    <Badge key={i} variant="secondary">{phrase}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
