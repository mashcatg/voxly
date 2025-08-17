'use client'

import { CircularProgress } from '@/components/ui/progress'
import React from 'react'

interface ConnectionStatusProps {
  status: 'queued' | 'connecting' | 'connected' | 'disconnected'
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusMessages = {
    queued: 'Queued - Preparing for conversation...',
    connecting: 'Connecting to assistant...',
    connected: 'Connected',
    disconnected: 'Disconnected'
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        {status !== 'disconnected' && (
          <CircularProgress isIndeterminate className="w-8 h-8" />
        )}
        <p className="text-sm">{statusMessages[status]}</p>
      </div>
    </div>
  )
}
