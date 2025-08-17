'use client'

import { Card } from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"
import { type Conversation, type TranscriptMessage } from '@/types/conversation'
import { TranscriptDisplay } from './transcript-display'

interface ConversationOverviewProps {
  conversation: Conversation
}

export function ConversationOverview({ conversation }: ConversationOverviewProps) {
  // Calculate basic analytics if not provided
  const analytics = conversation.analytics || {
    speakingTime: conversation.duration || 0,
    turnCount: conversation.transcript?.length || 0,
    responseRate: conversation.transcript ? 
      Math.round((conversation.transcript.filter((m: TranscriptMessage) => m.role === 'assistant').length / conversation.transcript.length) * 100) : 0,
    clarity: 0,
    engagement: 0,
    sentiment: {
      positive: 0,
      neutral: 100,
      negative: 0
    }
  }

  if (!conversation.transcript && !conversation.summary && !conversation.duration) {
    return (
      <div className="h-full p-8 flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground text-lg">
            Start a conversation to see the transcript and summary here
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full p-8 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {conversation.title || 'Untitled Conversation'}
        </h2>

        {conversation.summary && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-muted-foreground">{conversation.summary}</p>
          </div>
        )}
        
        {conversation.vapi_call_id && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">Speaking Time</p>
                <p className="text-2xl font-bold">{Math.floor(analytics.speakingTime / 60)}m {analytics.speakingTime % 60}s</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">Turn Taking</p>
                <p className="text-2xl font-bold">{analytics.turnCount} turns</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold">{analytics.responseRate}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">Clarity Score</p>
                <p className="text-2xl font-bold">{analytics.clarity}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">Engagement Score</p>
                <p className="text-2xl font-bold">{analytics.engagement}%</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/10">
                <p className="text-sm text-muted-foreground">Sentiment Analysis</p>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 bg-success/20 h-2 rounded-full" style={{ width: `${analytics.sentiment.positive}%` }} />
                  <div className="flex-1 bg-muted h-2 rounded-full" style={{ width: `${analytics.sentiment.neutral}%` }} />
                  <div className="flex-1 bg-destructive/20 h-2 rounded-full" style={{ width: `${analytics.sentiment.negative}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {conversation.transcript && conversation.transcript.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Transcript</h3>
            <ScrollArea className="h-[400px]">
              <TranscriptDisplay messages={conversation.transcript} />
            </ScrollArea>
          </div>
        )}
      </Card>
    </div>
  )
}
