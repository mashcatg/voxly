'use client'

import { useState, useCallback, useRef } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import Vapi from '@vapi-ai/web'

// Constants for assistant IDs
const ASSISTANT_IDS = {
  conversation: 'acaef06d-5735-41fa-a88e-93e71ba557a1', // Your working assistant ID
  challenge: 'acaef06d-5735-41fa-a88e-93e71ba557a1'  // Use the same ID for now
} as const

interface UseVapiOptions {
  mode?: 'conversation' | 'challenge'
  onTranscriptUpdate?: (transcript: any) => void
  onStatusChange?: (status: string) => void
  onError?: (error: any) => void
  conversationId?: string | null
  onVapiCallIdReceived?: (callId: string) => void
}

interface Transcript {
  role: string
  text: string
  timestamp: number
}

export function useVapi({ 
  mode = 'conversation',
  onTranscriptUpdate, 
  onStatusChange,
  onError,
  conversationId,
  onVapiCallIdReceived
}: UseVapiOptions) {
  const { supabase } = useSupabase()
  const [vapiInstance, setVapiInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  const [vapiCallId, setVapiCallId] = useState<string | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const transcriptRef = useRef<Transcript[]>([])
  const vapiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY

  const createConversation = useCallback(async (callId: string, duration: number, transcript: Transcript[]) => {
    try {
      console.log('Creating conversation with:', { callId, duration, transcript })
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user found')
      }

      const conversationData = {
        user_id: user.id,
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Call`,
        mode,
        assistant_id: mode === 'conversation' 
          ? 'acaef06d-5735-41fa-a88e-93e71ba557a1'
          : 'dc7f4b1d-cdae-4d5b-bbee-d0e2a7c5305b',
        status: 'completed',
        transcript,
        duration,
        vapi_call_id: callId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        is_public: false
      }

      console.log('Inserting conversation:', conversationData)

      const { data, error: insertError } = await supabase
        .from('conversations')
        .insert([conversationData])
        .select('*')
        .single()

      if (insertError) {
        console.error('Error creating conversation:', insertError)
        throw insertError
      }

      console.log('Conversation created successfully:', data)
      return data
    } catch (err) {
      console.error('Error in createConversation:', err)
      throw err
    }
  }, [supabase, mode])

  const startCall = useCallback(async () => {
    if (!vapiKey) {
      throw new Error('VAPI API key is not configured')
    }

    try {
      setIsLoading(true)
      setError(null)
      onStatusChange?.('initializing')

      // Use the correct assistant ID
      const assistantId = ASSISTANT_IDS[mode]
      console.log('Starting call with assistant ID:', assistantId)

      const webCallResponse = await fetch('https://api.vapi.ai/call/web', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vapiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId
        })
      })

      if (!webCallResponse.ok) {
        const errorData = await webCallResponse.json()
        console.error('VAPI API Error:', errorData)
        throw new Error(`VAPI API error: ${JSON.stringify(errorData)}`)
      }

      const webCallData = await webCallResponse.json()
      console.log('VAPI call response:', webCallData)
      
      if (!webCallData?.id) {
        throw new Error('No call ID received from VAPI')
      }

      setVapiCallId(webCallData.id)
      onVapiCallIdReceived?.(webCallData.id)
      startTimeRef.current = Date.now()
      transcriptRef.current = []

      // Initialize VAPI with the received call ID
      const vapi = new Vapi(vapiKey)
      
      vapi.on('message', (message: any) => {
        console.log('Message received:', message)
        if (message.type === 'transcript') {
          const transcriptEntry = {
            role: message.role,
            text: message.transcript,
            timestamp: Date.now()
          }
          transcriptRef.current.push(transcriptEntry)
          onTranscriptUpdate?.(transcriptEntry)
        }
      })

      vapi.on('error', (err: any) => {
        console.error('VAPI error:', err)
        onError?.(err)
      })

      // Start the call
      await vapi.start(assistantId)
      
      setVapiInstance(vapi)
      setIsLoading(false)
      onStatusChange?.('connected')
      console.log('VAPI call initialized successfully')

    } catch (err) {
      console.error('Error in startCall:', err)
      setError(err)
      onError?.(err instanceof Error ? err : new Error('Failed to start call'))
      setIsLoading(false)
      throw err
    }
  }, [mode, onTranscriptUpdate, onError, onStatusChange, onVapiCallIdReceived, vapiKey])

  const endCall = useCallback(async () => {
    if (!vapiInstance || !vapiCallId || !startTimeRef.current) {
      console.log('Cannot end call - missing required data:', {
        hasVapi: !!vapiInstance,
        vapiCallId,
        hasStartTime: !!startTimeRef.current
      })
      return
    }

    try {
      console.log('Ending call...')
      await vapiInstance.stop()
      
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000)
      console.log('Call ended. Duration:', duration, 'Transcript:', transcriptRef.current)

      // Create conversation in database
      const conversation = await createConversation(
        vapiCallId,
        duration,
        transcriptRef.current
      )
      
      console.log('Created conversation:', conversation)

      // Cleanup
      setVapiInstance(null)
      setVapiCallId(null)
      startTimeRef.current = null
      transcriptRef.current = []
      onStatusChange?.('ended')
      
      return duration
    } catch (err) {
      console.error('Error ending call:', err)
      onError?.(err instanceof Error ? err : new Error('Failed to end call'))
    }
  }, [vapiInstance, vapiCallId, createConversation, onStatusChange, onError])

  return {
    vapi: vapiInstance,
    isLoading,
    error,
    startCall,
    endCall,
    vapiCallId
  }
}
