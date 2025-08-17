'use client'
import { Mic, MicOff, PhoneOff, Subtitles, AudioWaveform, CaptionsOff } from 'lucide-react'
import { Button } from '../ui/button'
import { useVapi } from '@/hooks/use-vapi'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface FloatingControlsProps {
  isCallActive: boolean
  isMuted: boolean
  isSubtitlesOn: boolean
  onToggleCall: (isActive: boolean) => void
  onToggleMute: () => void
  onToggleSubtitles: () => void
  currentConversationId?: string | null
  onVapiCallIdReceived?: (callId: string) => void
  onCallDurationChange?: (duration: number) => void
}

export function FloatingControls({
  isCallActive,
  isMuted,
  isSubtitlesOn,
  onToggleCall,
  onToggleMute,
  onToggleSubtitles,
  currentConversationId,
  onVapiCallIdReceived
}: FloatingControlsProps) {

  const router = useRouter()
  const { vapi, startCall, endCall } = useVapi({
    mode: 'conversation',
    conversationId: currentConversationId,
    onVapiCallIdReceived,
    onStatusChange: (status) => {
      console.log('Call status:', status)
    },
    onError: (error) => {
      console.error('VAPI error in FloatingControls:', error)
      toast.error(error.message || 'An error occurred with the call')
    }
  })

  const handleCallToggle = async () => {
    try {
      if (!isCallActive) {
        console.log('Starting call with conversationId:', currentConversationId)
        await startCall()
        onToggleCall(true)
      } else {
        console.log('Ending call...')
        const result = await endCall()
        console.log('End call result:', result)
        
        const { duration, conversationId } = result
        console.log('Duration:', duration, 'ConversationId:', conversationId)
        
        onToggleCall(false)
        
        // Debug the routing logic
        if (conversationId) {
          console.log('Redirecting to new conversation:', conversationId)
          router.push(`/chat/${conversationId}`)
        } else if (currentConversationId) {
          console.log('Redirecting to current conversation:', currentConversationId)
          router.push(`/chat/${currentConversationId}`)
        } else {
          console.log('No conversation ID available, staying on current page')
          // Optionally redirect to a default chat page
          // router.push('/chat')
        }
      }
    } catch (error) {
      console.error('Error toggling call:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to toggle call')
      onToggleCall(false)
    }
  }

  // Debug current conversation ID changes
  useEffect(() => {
    console.log('currentConversationId changed:', currentConversationId)
  }, [currentConversationId])

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 py-6">
      <Button 
        variant={isMuted ? "ghost" : "secondary"}
        size="icon"
        onClick={onToggleMute}
        className="h-10 w-10 rounded-full"
        disabled={!isCallActive}
      >
        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>
      
      <Button
        variant={isCallActive ? "destructive" : "default"}
        size="icon"
        onClick={handleCallToggle}
        className={`h-14 w-14 rounded-full`}
      >
        {isCallActive ? (
          <PhoneOff className="h-6 w-6 rotate-225" />
        ) : (
          <AudioWaveform className="h-6 w-6" />
        )}
      </Button>

      <Button
        variant={isSubtitlesOn ? "secondary" : "ghost"}
        size="icon"
        onClick={onToggleSubtitles}
        className="h-10 w-10 rounded-full"
        disabled={!isCallActive}
      >
        {isSubtitlesOn ? <Subtitles className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
      </Button>
    </div>
  )
}