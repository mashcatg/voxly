'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useSupabase } from './supabase-provider'
import type { Conversation } from '@/types/conversation'

interface ConversationsContextType {
  conversations: Conversation[]
  activeConversation: Conversation | null
  loading: boolean
  fetchConversations: () => Promise<void>
  getConversationDetails: (conversationId: string) => Promise<any>
  createConversation: (mode: string, assistantId: string, description: string) => Promise<Conversation | null>
  updateDuration: (conversationId: string, duration: number) => Promise<void>
  updateVapiCallId: (conversationId: string, vapiCallId: string) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  shareConversation: (conversationId: string) => Promise<string>
}

const ConversationsContext = createContext<ConversationsContextType | undefined>(undefined)

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { supabase } = useSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConversationDetails = async (conversationId: string) => {
    try {
      // First get the conversation from Supabase
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (conversationError) throw conversationError
      if (!conversation?.vapi_call_id) throw new Error('No VAPI call ID found')

      // Then get the VAPI call details using the server token
      const response = await fetch(`https://api.vapi.ai/call/${conversation.vapi_call_id}`, {
        headers: {
          'Authorization': `Bearer 7d671318-0ecb-4e7a-a388-36b3ede280b9` // VAPI_SERVER_TOKEN
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`VAPI API error: ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching VAPI call details:', error)
      return null
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const createConversation = async (mode: string, assistantId: string, description: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([{
          user_id: user.id,
          title: description,
          mode,
          assistant_id: assistantId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      if (!conversation) throw new Error('No conversation returned')

      setConversations(prev => [conversation, ...prev])
      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  const updateDuration = async (conversationId: string, duration: number) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ duration })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating duration:', error)
    }
  }

  const updateVapiCallId = async (conversationId: string, vapiCallId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ vapi_call_id: vapiCallId })
        .eq('id', conversationId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating VAPI call ID:', error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  const shareConversation = async (conversationId: string) => {
    try {
      // Set conversation to public
      const { error } = await supabase
        .from('conversations')
        .update({ is_public: true })
        .eq('id', conversationId)

      if (error) throw error

      // Copy shareable link
      const shareableLink = `${window.location.origin}/chat/${conversationId}`
      await navigator.clipboard.writeText(shareableLink)
      return shareableLink
    } catch (error) {
      console.error('Error sharing conversation:', error)
      throw error
    }
  }

  return (
    <ConversationsContext.Provider value={{
      conversations,
      activeConversation,
      loading,
      fetchConversations,
      getConversationDetails,
      createConversation,
      updateDuration,
      updateVapiCallId,
      deleteConversation,
      shareConversation
    }}>
      {children}
    </ConversationsContext.Provider>
  )
}

export function useConversationsContext() {
  const context = useContext(ConversationsContext)
  if (context === undefined) {
    throw new Error('useConversationsContext must be used within a ConversationsProvider')
  }
  return context
}