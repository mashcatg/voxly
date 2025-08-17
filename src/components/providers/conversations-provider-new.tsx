'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useSupabase } from './supabase-provider'
import type { Conversation } from '@/types/conversation'

interface ConversationsContextType {
  conversations: Conversation[]
  activeConversation: Conversation | null
  loading: boolean
  fetchConversations: () => Promise<void>
  getConversationDetails: (vapiCallId: string) => Promise<any>
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

      // Update active conversation if it exists in the list
      if (activeConversation) {
        const active = data?.find(c => c.id === activeConversation.id)
        setActiveConversation(active || null)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConversationDetails = async (conversationId: string) => {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (error) throw error
      return conversation
    } catch (error) {
      console.error('Error fetching conversation details:', error)
      throw error
    }
  }

  const createConversation = async (
    mode: string, 
    assistantId: string, 
    description: string
  ): Promise<Conversation | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const newConversation = {
        user_id: user.id,
        mode,
        assistant_id: assistantId,
        status: 'active',
        title: mode === 'challenge' ? 'New Challenge' : 'New Conversation',
        description
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([newConversation])
        .select()
        .single()

      if (error) throw error

      setConversations(prev => [data, ...prev])
      setActiveConversation(data)
      return data
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

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, duration } : conv
        )
      )

      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prev ? { ...prev, duration } : null)
      }
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

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, vapi_call_id: vapiCallId } : conv
        )
      )

      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => prev ? { ...prev, vapi_call_id: vapiCallId } : null)
      }
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

      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  const shareConversation = async (conversationId: string): Promise<string> => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_public: true })
        .eq('id', conversationId)

      if (error) throw error

      const shareableLink = `${window.location.origin}/chat/${conversationId}`
      await navigator.clipboard.writeText(shareableLink)

      return shareableLink
    } catch (error) {
      console.error('Error sharing conversation:', error)
      throw error
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [])

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
      shareConversation,
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
