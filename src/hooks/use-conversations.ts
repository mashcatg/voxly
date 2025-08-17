'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Conversation } from '@/types/conversation'

export function useConversations() {
  const { supabase } = useSupabase()
  const [conversations, setConversations] = useState<Conversation[]>([])
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

  const getConversationDetails = async (vapiCallId: string) => {
    try {
      const response = await fetch(`https://api.vapi.ai/call/${vapiCallId}`, {
        headers: {
          'Authorization': `Bearer 7d671318-0ecb-4e7a-a388-36b3ede280b9`
        }
      })
      return await response.json()
    } catch (error) {
      console.error('Error fetching VAPI call details:', error)
      return null
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

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

  return {
    conversations,
    loading,
    fetchConversations,
    getConversationDetails,
    deleteConversation
  }
}