'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'bot' | 'system';
  message: string;
  time?: number;
}

interface MessageDisplayProps {
  message: Message;
  audioTimestamp?: number;
  isHighlighted?: boolean;
}

export function MessageDisplay({ message, audioTimestamp, isHighlighted }: MessageDisplayProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 transition-colors',
        isHighlighted && 'bg-accent/50',
        !isUser && 'flex-row-reverse'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage
          src={isUser ? '/user-avatar.png' : '/voxly-logo.png'}
          alt={isUser ? 'User' : 'Voxly'}
        />
        <AvatarFallback>
          {isUser ? 'U' : 'V'}
        </AvatarFallback>
      </Avatar>

      <div className={cn(
        'flex flex-col max-w-[80%]',
        !isUser && 'items-end'
      )}>
        <div className={cn(
          'rounded-lg p-3',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}>
          {message.message}
        </div>
        {message.time && (
          <span className="text-xs text-muted-foreground mt-1">
            {new Date(message.time).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
