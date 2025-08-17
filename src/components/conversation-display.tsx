'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AudioPlayer } from '@/components/ui/audio-player';
import { MessageDisplay } from '@/components/chat/message-display';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConversationProps {
  messages: Array<{
    role: 'user' | 'bot' | 'system';
    message: string;
    time: number;
  }>;
  recordingUrl?: string;
  summary?: string;
  onTabChange?: (tab: string) => void;
}

export function ConversationDisplay({ 
  messages, 
  recordingUrl, 
  summary,
  onTabChange 
}: ConversationProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  const getCurrentMessage = () => {
    if (!messages.length) return null;
    
    return messages.reduce((prev, curr) => {
      if (curr.time <= currentTime * 1000) {
        return curr;
      }
      return prev;
    });
  };

  const highlightedMessage = getCurrentMessage();

  return (
    <Card className="flex flex-col h-full">
      <Tabs 
        defaultValue="chat" 
        className="flex-1 flex flex-col"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="border-b px-4">
          <TabsList>
            <TabsTrigger value="chat">Conversation</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent 
          value="chat" 
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message, index) => (
            <MessageDisplay
              key={index}
              message={message}
              isHighlighted={message === highlightedMessage}
            />
          ))}
          <div ref={messagesEndRef} />
        </TabsContent>

        <TabsContent value="summary" className="p-4">
          <div className="prose dark:prose-invert">
            <h3>Conversation Summary</h3>
            <p>{summary}</p>
          </div>
        </TabsContent>
      </Tabs>

      {recordingUrl && (
        <div className="border-t p-4">
          <AudioPlayer
            src={recordingUrl}
            onTimeUpdate={setCurrentTime}
          />
        </div>
      )}
    </Card>
  );
}
