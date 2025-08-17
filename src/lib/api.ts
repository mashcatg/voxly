'use client';

import { createVapiInstance, callVapiMethod } from './vapi';
import type Vapi from '@vapi-ai/web';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const CREDITS_PER_CALL = 1; // Define credits cost per call

export interface Conversation {
  id: string;
  title: string;
  user_id: string;
  mode: 'conversation' | 'challenge';
  messages: Message[];
  summary?: string;
  analysis?: {
    confidence_score?: number;
    communication_score?: number;
    areas_of_improvement?: string[];
    strengths?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export async function createNewConversation(mode: 'conversation' | 'challenge', title?: string) {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const conversation = {
      user_id: user.id,
      title: title || `New ${mode} ${new Date().toLocaleString()}`,
      mode,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

export async function updateConversation(conversationId: string, messages: Message[], summary?: string, analysis?: Conversation['analysis']) {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const update: Partial<Conversation> = {
      messages,
      updated_at: new Date().toISOString()
    };

    if (summary) {
      update.summary = summary;
    }

    if (analysis) {
      update.analysis = analysis;
    }

    const { data, error } = await supabase
      .from('conversations')
      .update(update)
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns this conversation
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
}

export async function getConversations() {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

export async function ensureAuthenticated() {
  const supabase = createClientComponentClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('User not authenticated');
  }
  return user;
}

export async function getUserCredits() {
  const supabase = createClientComponentClient();
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User error:', userError);
      return 0;
    }

    // Get credits
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, create initial credits record
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({ 
            user_id: user.id, 
            credits: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating credits record:', insertError);
          return 0;
        }
        return newData?.credits ?? 0;
      }
      console.error('Error fetching credits:', error);
      return 0;
    }
    return data?.credits ?? 0;
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return 0;
  }
}

export async function deductCredits(durationInMinutes: number) {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Calculate credits to deduct (1 credit per minute, supporting fractional minutes)
    const creditsToDeduct = parseFloat(durationInMinutes.toFixed(2));

    // Get current credits
    const currentCredits = await getUserCredits();
    if (currentCredits < creditsToDeduct) {
      throw new Error('Insufficient credits');
    }

    // Start a transaction
    const { data, error } = await supabase.rpc('deduct_credits_and_log', {
      p_user_id: user.id,
      p_credits_used: creditsToDeduct,
      p_action: 'call_usage',
      p_metadata: JSON.stringify({
        duration_minutes: durationInMinutes,
        timestamp: new Date().toISOString()
      })
    });

    if (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }

    return data.remaining_credits;
  } catch (error) {
    console.error('Error in deductCredits:', error);
    throw error;
  }
}

type CallMode = "conversation" | "challenge";

/**
 * Start a VAPI call with the specified assistant
 */
export async function startVapiCall(mode: CallMode = "conversation") {
  try {
    // Deduct credits before starting call
    await deductCredits();

    // Map mode to assistant ID
    const assistantId = mode === 'conversation' 
      ? 'acaef06d-5735-41fa-a88e-93e71ba557a1'  // Conversation assistant
      : 'dc7f4b1d-cdae-4d5b-bbee-d0e2a7c5305b';  // Challenge assistant

    // Initialize VAPI instance
    const vapi = await createVapiInstance({
      apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY!,
      onError: (error: any) => {
        console.error('VAPI Error:', error);
        // Handle specific error types
        if (error.error?.type === 'ejected' || error.errorMsg === 'Meeting has ended') {
          throw new Error('Call ended unexpectedly. Please try again.');
        } else if (error.error?.type === 'deviceError') {
          throw new Error('Device error: Please check your microphone settings.');
        } else {
          throw error;
        }
      },
      onDisconnected: () => {
        console.log('VAPI call disconnected');
        // Handle graceful disconnection
      }
    });

    try {
      await callVapiMethod(vapi, 'start', assistantId);
      return vapi;
    } catch (error: any) {
      // Handle start-specific errors
      if (error.message?.includes('Microphone access')) {
        throw new Error('Please allow microphone access to start the call.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error starting call:', error);
    throw error;
  }
}

/**
 * Stop an active VAPI call
 */
export async function stopVapiCall(vapi: Vapi) {
  try {
    await callVapiMethod(vapi, 'stop');
  } catch (error) {
    console.error('Error stopping call:', error);
    throw error;
  }
}

/**
 * Toggle mute state for VAPI call
 */
export async function toggleMute(vapi: Vapi) {
  try {
    await callVapiMethod(vapi, 'toggleMute');
  } catch (error) {
    console.error('Error toggling mute:', error);
    throw error;
  }
}
