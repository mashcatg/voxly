'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import type { ConversationAnalysis } from '@/lib/analysis-helpers'

function getScoreColor(score: number): string {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getScoreIconColor(score: number): string {
  if (score >= 0.8) return 'text-green-500';
  if (score >= 0.5) return 'text-yellow-500';
  return 'text-red-500';
}

function ScoreIndicator({ score }: { score: number }) {
  const Icon = score >= 0.8 ? CheckCircle : score >= 0.5 ? Clock : AlertCircle;
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm">{(score * 100).toFixed(1)}%</span>
      <Icon className={`w-4 h-4 ${getScoreIconColor(score)}`} />
    </div>
  );
}

export function ConversationMetrics({ analysis }: { analysis: ConversationAnalysis | null }) {
  if (!analysis) {
    return <AnalyticsLoadingSkeleton />;
  }

  const { userAnalysis, conversationFlow, speechPatterns } = analysis;

  const communicationMetrics = [
    { name: 'Clarity', value: userAnalysis.communicationStyle.clarity },
    { name: 'Confidence', value: userAnalysis.communicationStyle.confidence },
    { name: 'Fluency', value: userAnalysis.communicationStyle.fluency },
    { name: 'Topic Coherence', value: conversationFlow.topicCoherence },
    { name: 'Turn Taking', value: conversationFlow.turnTaking }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Communication Style Overview */}
      <Card className="p-4 col-span-full">
        <h3 className="text-lg font-semibold mb-4">Communication Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {communicationMetrics.map((metric) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{metric.name}</span>
                <ScoreIndicator score={metric.value} />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getScoreColor(metric.value)}`}
                  style={{ width: `${metric.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Grammar and Structure */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Grammar & Structure</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Overall Score</span>
            <ScoreIndicator score={userAnalysis.grammarAndStructure.score} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Issues Identified:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {userAnalysis.grammarAndStructure.issues.map((issue, i) => (
                <li key={i} className="text-gray-600">{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Speech Patterns */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Speech Patterns</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Filler Words</span>
              <span className="text-sm">{(speechPatterns.fillers.frequency * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getScoreColor(1 - speechPatterns.fillers.frequency)}`}
                style={{ width: `${speechPatterns.fillers.frequency * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Common Fillers:</h4>
            <div className="flex flex-wrap gap-2">
              {speechPatterns.fillers.examples.map((example, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm">{example}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Vocabulary Analysis */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Vocabulary Usage</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Level</span>
            <span className="font-medium capitalize">{speechPatterns.vocabulary.level}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Diversity</span>
              <span>{(speechPatterns.vocabulary.diversity * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getScoreColor(speechPatterns.vocabulary.diversity)}`}
                style={{ width: `${speechPatterns.vocabulary.diversity * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Highlights:</h4>
            <div className="flex flex-wrap gap-2">
              {speechPatterns.vocabulary.highlights.map((highlight, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-sm">{highlight}</span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AnalyticsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
