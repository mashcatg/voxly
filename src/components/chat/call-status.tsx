'use client'

import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type CallStatusType = 
  | 'idle'
  | 'initializing'
  | 'queued'
  | 'connecting'
  | 'connected'
  | 'in-call'
  | 'ending'
  | 'ended'
  | 'disconnected'
  | 'error'

interface CallStatusProps {
  status: CallStatusType
  className?: string
}

export function CallStatus({ status, className = '' }: CallStatusProps) {
  const statusConfig = {
    idle: {
      show: false,
      message: 'Ready to start'
    },
    initializing: {
      show: true,
      message: 'Initializing call...',
      icon: Loader2
    },
    queued: {
      show: true,
      message: 'Queued. Connecting to AI assistant...',
      icon: Loader2
    },
    connecting: {
      show: true,
      message: 'Establishing connection...',
      icon: Loader2
    },
    connected: {
      show: true,
      message: 'Connected! Starting conversation...',
      icon: CheckCircle2
    },
    'in-call': {
      show: false,
      message: 'In call'
    },
    ending: {
      show: true,
      message: 'Ending call...',
      icon: Loader2
    },
    ended: {
      show: false,
      message: 'Call ended'
    },
    disconnected: {
      show: true,
      message: 'Call disconnected',
      icon: AlertCircle
    },
    error: {
      show: true,
      message: 'Error occurred',
      icon: AlertCircle
    }
  }

  const config = statusConfig[status]
  
  if (!config.show) return null

  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
      {'icon' in config && config.icon && (
        <config.icon 
          className={cn(
            'h-4 w-4',
            status === 'error' 
              ? 'text-destructive' 
              : config.icon === Loader2 
                ? 'animate-spin' 
                : ''
          )} 
        />
      )}
      <span className="text-sm">{config.message}</span>
    </div>
  );
}
