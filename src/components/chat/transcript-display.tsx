import type { TranscriptMessage } from '@/types/conversation'

interface TranscriptDisplayProps {
  messages?: TranscriptMessage[] | null;
}

export function TranscriptDisplay({ messages = [] }: TranscriptDisplayProps) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-32 w-[80%] max-w-2xl max-h-[40vh] overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
      {!messages || messages.length === 0 ? (
        <p className="text-center text-muted-foreground text-lg">Conversation will appear here...</p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg, i) => (
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
  );
}
