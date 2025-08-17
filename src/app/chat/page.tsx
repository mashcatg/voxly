'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useConversationsContext } from '@/components/providers/conversations-provider'
import { AIAvatar } from '@/components/chat/ai-avatar'
import { FloatingControls } from '@/components/chat/floating-controls'
import { TranscriptDisplay } from '@/components/chat/transcript-display'
import { startVapiCall, stopVapiCall } from '@/lib/api'
import { useSidebarStore } from '@/stores/sidebar-store'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

import type { TranscriptMessage } from '@/types/conversation'

interface Message extends TranscriptMessage {
  role: string;
  text: string;
}

export type ConversationMode = "conversation" | "challenge"

export default function ChatPage() {
  const { createConversation, updateDuration, updateVapiCallId } = useConversationsContext()
  const [mode, setMode] = useState<ConversationMode>("conversation")
  const [isCallActive, setIsCallActive] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isSubtitlesOn, setIsSubtitlesOn] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [autoStartAttempted, setAutoStartAttempted] = useState(false)
  const [callStatus, setCallStatus] = useState<string>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [creditsUsed, setCreditsUsed] = useState(0)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const vapiRef = useRef<any>(null)
  const supabase = createClientComponentClient()

  const deductCallCredits = async (user: any, currentCredits: number) => {
    const creditsToDeduct = 1; // Initial deduction for starting call
    const afterCredits = currentCredits - creditsToDeduct;

    // Insert credit history record
    const { error: historyError } = await supabase
      .from('credit_history')
      .insert({
        user_id: user.id,
        credits_added: -creditsToDeduct,
        credits_before: currentCredits,
        credits_after: afterCredits,
        source: 'voice_call',
        metadata: {
          call_started_at: new Date().toISOString(),
          mode: mode,
          initial_deduction: true
        }
      });

    if (historyError) {
      throw new Error('Failed to record credit deduction');
    }

    // Update user credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ credits: afterCredits })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to update user credits');
    }

    return afterCredits;
  };

  const handleCallToggle = async () => {
    try {
      if (!isCallActive) {
        // Check authentication and credits
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        const { data: userCredits } = await supabase
          .from('user_credits')
          .select('credits')
          .eq('user_id', user.id)
          .single();

        if (!userCredits || userCredits.credits < 1) {
          throw new Error('Insufficient credits');
        }

        // Deduct initial credit and record history
        await deductCallCredits(user, userCredits.credits);

        // Create conversation and start call
        const assistantId = mode === "conversation" 
          ? 'acaef06d-5735-41fa-a88e-93e71ba557a1'
          : 'dc7f4b1d-cdae-4d5b-bbee-d0e2a7c5305b';

        const conversation = await createConversation(
          mode,
          assistantId,
          'Starting a new voice conversation'
        );

        if (!conversation) {
          throw new Error('Failed to create conversation');
        }

        setCurrentConversationId(conversation.id);

        // Start call
        if (!vapiRef.current) {
          vapiRef.current = await startVapiCall(mode);
          
          // Set up event listeners
          vapiRef.current.on('transcript', (message: any) => {
            const newMessage: Message = {
              role: message.role,
              text: message.text,
              message: message.text,
              time: Date.now()
            };
            setMessages(prev => [...prev, newMessage]);
          });

          vapiRef.current.on('speaking', (speaking: boolean) => {
            setIsSpeaking(speaking);
          });
        }

        // Update VAPI call ID after successful initialization
        if (vapiRef.current && vapiRef.current.conversationId) {
          await updateVapiCallId(conversation.id, vapiRef.current.conversationId);
        }

        setIsCallActive(true);
        setMessages([]); // Clear messages when starting new call
        setCallDuration(0);
        setCreditsUsed(0);

      } else {
        // End call
        if (vapiRef.current) {
          await stopVapiCall(vapiRef.current);
          vapiRef.current = null;
        }

        // Update conversation with final duration and VAPI call ID
        if (currentConversationId) {
          await updateDuration(currentConversationId, callDuration);
          if (vapiRef.current?.conversationId) {
            await updateVapiCallId(currentConversationId, vapiRef.current.conversationId);
          }
          
          // Redirect to conversation page
          window.location.href = `/chat/${currentConversationId}`;
          setCurrentConversationId(null);
        }

        setIsCallActive(false);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('Failed to toggle call:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to manage call');
      setIsCallActive(false);
      setIsSpeaking(false);
    }
  };

  // Timer for call duration and credit usage
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          // Calculate credits used (1 credit per minute)
          const newCreditsUsed = newDuration / 60;
          setCreditsUsed(Number(newCreditsUsed.toFixed(2)));
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Credit deduction is now handled in startVapiCall
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  // Handle visibility change to keep timer running in background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isCallActive && !timerRef.current) {
        timerRef.current = setInterval(() => {
          setCallDuration(prev => {
            const newDuration = prev + 1;
            const newCreditsUsed = newDuration / 60;
            setCreditsUsed(Number(newCreditsUsed.toFixed(2)));
            return newDuration;
          });
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCallActive]);

  const deductCredits = async (credits: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc('spend_credits', {
        p_user_id: user.id,
        p_credits_to_spend: credits,
        p_source: 'vapi_call',
        p_metadata: {
          call_duration: callDuration,
          credits_used: credits,
          mode: mode
        }
      });

      if (error) {
        console.error('Error deducting credits:', error);
      }
    } catch (error) {
      console.error('Failed to deduct credits:', error);
    }
  };

  // Removed auto-start functionality

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024
      if (isMobile) {
        setIsSidebarCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const { close } = useSidebarStore()
  const pathname = usePathname()
  
  // Auto close sidebar on route change for mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      close()
    }
  }, [pathname, close])

  return (
    <div className="flex h-[90vh] overflow-hidden bg-background">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">        
        <main className="flex-1 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-sm font-mono">
            <div className="mb-1">
              Time: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <AIAvatar 
            isActive={isCallActive} 
            isSpeaking={isSpeaking}
          />
          
          {isSubtitlesOn && (
            <TranscriptDisplay messages={messages} />
          )}
          
          <FloatingControls
            isCallActive={isCallActive}
            isMuted={isMuted}
            isSubtitlesOn={isSubtitlesOn}
            onToggleCall={handleCallToggle}
            onToggleMute={() => setIsMuted(!isMuted)}
            onToggleSubtitles={() => setIsSubtitlesOn(!isSubtitlesOn)}
            currentConversationId={currentConversationId}
            onVapiCallIdReceived={(callId) => {
              if (currentConversationId) {
                updateVapiCallId(currentConversationId, callId)
              }
            }}
            onTranscriptUpdate={setCurrentTranscript}
            onAISpeakingChange={setIsSpeaking}
          />
        </main>
      </div>
    </div>
  )
}
