'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/supabase-provider'

interface Conversation {
  id: string
  user_id: string
  title: string
  mode: string
  assistant_id: string
  vapi_call_id: string | null
  status: string
  transcript: any[]
  duration: number | null
  created_at: string
  updated_at: string
  last_message_at: string
  is_public: boolean
  summary: string | null
  structured_data: any | null
  success_evaluation: any | null
}

interface ConversationsContextType {
  conversations: Conversation[]
  activeConversation: Conversation | null
  setActiveConversation: (conversation: Conversation | null) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<Conversation | undefined>
  deleteConversation: (id: string) => Promise<void>
}

const ConversationsContext = createContext<ConversationsContextType | null>(null)

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)

  useEffect(() => {
    // Fetch initial conversations
    fetchConversations()

    // Subscribe to new conversations
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as Conversation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return
    }

    setConversations(data)
  }

  const addConversation = (conversation: Conversation) => {
    setConversations(prev => [conversation, ...prev])
    setActiveConversation(conversation)
  }

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    try {
      // Update in Supabase first
      const { data, error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation:', error);
        return;
      }

      // If successful, update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...conv, ...updates } : conv
        )
      );
      
      if (activeConversation?.id === id) {
        setActiveConversation(prev => prev ? { ...prev, ...updates } : null);
      }

      return data;
    } catch (error) {
      console.error('Error in updateConversation:', error);
    }
  }

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting conversation:', error)
      return
    }

    setConversations(prev => prev.filter(conv => conv.id !== id))
    
    if (activeConversation?.id === id) {
      setActiveConversation(null)
      router.push('/chat')
    }
  }

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        addConversation,
        updateConversation,
        deleteConversation
      }}
    >
      {children}
    </ConversationsContext.Provider>
  )
}

export function useConversations() {
  const context = useContext(ConversationsContext)
  if (!context) {
    throw new Error('useConversations must be used within a ConversationsProvider')
  }
  return context
}
