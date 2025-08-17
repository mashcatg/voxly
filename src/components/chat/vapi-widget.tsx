'use client'

import React, { useState, useEffect } from 'react';
import Vapi from '@vapi-ai/web';

interface VapiWidgetProps {
  assistantId: string;
  onCallStateChange?: (isActive: boolean) => void;
  onSpeakingStateChange?: (isSpeaking: boolean) => void;
  className?: string;
}

export function VapiWidget({ 
  assistantId,
  onCallStateChange,
  onSpeakingStateChange,
  className
}: VapiWidgetProps) {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      console.error('VAPI API key not found');
      return;
    }

    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => {
      console.log('Call started');
      setIsConnected(true);
      onCallStateChange?.(true);
    });

    vapiInstance.on('call-end', () => {
      console.log('Call ended');
      setIsConnected(false);
      setIsSpeaking(false);
      onCallStateChange?.(false);
      onSpeakingStateChange?.(false);
    });

    vapiInstance.on('speech-start', () => {
      console.log('Assistant started speaking');
      setIsSpeaking(true);
      onSpeakingStateChange?.(true);
    });

    vapiInstance.on('speech-end', () => {
      console.log('Assistant stopped speaking');
      setIsSpeaking(false);
      onSpeakingStateChange?.(false);
    });

    vapiInstance.on('message', (message) => {
      if (message.type === 'transcript') {
        setTranscript(prev => [...prev, {
          role: message.role,
          text: message.transcript
        }]);
      }
    });

    vapiInstance.on('error', (error) => {
      console.error('Vapi error:', error);
      setIsConnected(false);
      setIsSpeaking(false);
      onCallStateChange?.(false);
      onSpeakingStateChange?.(false);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [assistantId, onCallStateChange, onSpeakingStateChange]);

  const startCall = () => {
    if (vapi) {
      vapi.start(assistantId);
    }
  };

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  return (
    <div className={`relative h-full ${className}`}>
      {!isConnected ? (
        <button
          onClick={startCall}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
            bg-primary text-primary-foreground hover:bg-primary/90
            px-8 py-4 rounded-full font-semibold cursor-pointer
            transition-all duration-300 hover:-translate-y-1
            flex items-center gap-2"
        >
          🎤 Talk to Assistant
        </button>
      ) : (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
              <span className="font-semibold">
                {isSpeaking ? 'Assistant Speaking...' : 'Listening...'}
              </span>
            </div>
            <button
              onClick={endCall}
              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600 transition-colors"
            >
              End Call
            </button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto bg-background/80 backdrop-blur-sm rounded-lg p-4">
            {transcript.length === 0 ? (
              <p className="text-center text-muted-foreground text-lg">
                Conversation will appear here...
              </p>
            ) : (
              <div className="space-y-2">
                {transcript.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
