'use client'

import { Card } from '@/components/ui/card'

interface RealTimeTranscriptProps {
  transcript: string
  isActive: boolean
}

export function RealTimeTranscript({ transcript, isActive }: RealTimeTranscriptProps) {
  if (!isActive) return null;

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl">
      <Card className="p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium">Live Transcript</span>
        </div>
        <p className="text-muted-foreground">
          {transcript || 'Listening...'}
        </p>
      </Card>
    </div>
  )
}
