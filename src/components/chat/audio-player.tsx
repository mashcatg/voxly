import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  recordingUrl: string
  stereoRecordingUrl?: string
  onError?: (error: Error) => void
}

export function AudioPlayer({ recordingUrl, stereoRecordingUrl, onError }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const audio = new Audio(stereoRecordingUrl || recordingUrl)
    audioRef.current = audio

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }

    const handleError = (e: ErrorEvent) => {
      setIsLoading(false)
      if (onError) {
        onError(new Error('Failed to load audio'))
      }
      console.error('Audio error:', e)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError as EventListener)
    audio.volume = volume

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError as EventListener)
      audio.pause()
    }
  }, [recordingUrl, stereoRecordingUrl, onError])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(
      Math.max(audioRef.current.currentTime + seconds, 0),
      duration
    )
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const newVolume = Math.max(0, Math.min(1, x / width))
    
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current) return
    
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const newTime = (x / width) * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div 
        className="relative pt-1 cursor-pointer" 
        onClick={handleProgressClick}
        ref={progressBarRef}
      >
        <div className="overflow-hidden h-2 text-xs flex rounded bg-secondary">
          <div 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-300"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {formatTime(currentTime)}
        </span>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => skip(-10)}
            disabled={isLoading}
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button 
            className={cn("h-8 w-8 rounded-full p-0", 
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            onClick={togglePlayPause}
            disabled={isLoading}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => skip(10)}
            disabled={isLoading}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <div 
            className="w-24 h-1 bg-secondary rounded-full cursor-pointer"
            onClick={handleVolumeChange}
          >
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
