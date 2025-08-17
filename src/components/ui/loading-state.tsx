'use client'

import Image from 'next/image'

interface LoadingStateProps {
  message?: string
  state?: 'loading' | 'queued' | 'connecting'
}

export function LoadingState({ message = 'Loading...', state = 'loading' }: LoadingStateProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        <div className="relative w-24 h-24 mx-auto">
          <Image
            src="/voxly-logo.png"
            alt="Voxly Logo"
            fill
            className={`object-contain ${
              state === 'loading' ? 'animate-pulse' :
              state === 'queued' ? 'animate-bounce' :
              'animate-ping'
            }`}
          />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
