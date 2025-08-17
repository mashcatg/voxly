'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { PlayCircle, PauseCircle, Volume2, MicOff, Mic } from 'lucide-react'
import { AudioPlayerState } from '@/types/conversation-ui'

interface FloatingControlsProps {
  playerState: AudioPlayerState
  onPlayPause: () => void
  onSeek: (value: number[]) => void
  onVolumeChange: (value: number[]) => void
  onMuteToggle: () => void
}

export function FloatingControls({
  playerState,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle
}: FloatingControlsProps) {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <Card className="p-4 shadow-lg flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12"
          onClick={onPlayPause}
        >
          {playerState.isPlaying ? (
            <PauseCircle className="h-8 w-8" />
          ) : (
            <PlayCircle className="h-8 w-8" />
          )}
        </Button>

        <div className="w-64 mx-4">
          <Slider
            value={[playerState.currentTime]}
            min={0}
            max={playerState.duration}
            step={0.1}
            onValueChange={onSeek}
            className="w-full"
          />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{formatTime(playerState.currentTime)}</span>
            <span>{formatTime(playerState.duration)}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onMuteToggle}
        >
          {playerState.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <Slider
            value={[playerState.volume]}
            min={0}
            max={1}
            step={0.1}
            onValueChange={onVolumeChange}
            className="w-20"
          />
        </div>
      </Card>
    </div>
  )
}
