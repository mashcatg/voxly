import { AudioLines } from 'lucide-react'

interface AIAvatarProps {
  isActive: boolean
  isSpeaking: boolean // Add new prop for speaking state
}

export function AIAvatar({ isActive, isSpeaking }: AIAvatarProps) {
  return (
    <div className="absolute left-1/2 top-[18rem] -translate-x-1/2 -translate-y-1/2">
      <div className={`relative h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center 
        ${isActive ? 'animate-pulse' : ''} 
        ${isSpeaking ? 'ring-4 ring-primary/50' : ''}`}>
        {isActive && (
          <>
            <div className={`absolute inset-0 rounded-full bg-primary/20 ${isSpeaking ? 'animate-ripple' : ''}`}></div>
            <div className={`absolute inset-0 rounded-full bg-primary/10 ${isSpeaking ? 'animate-ripple-delay' : ''}`}></div>
            <div className={`absolute inset-0 rounded-full bg-primary/5 ${isSpeaking ? 'animate-ripple-slow' : ''}`}></div>
          </>
        )}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <img 
            src="/voxly-logo.png" 
            className={`h-[5.5rem] w-[7rem] ${isSpeaking ? 'animate-wave' : ''}`} 
            alt="AI Avatar Voxly" 
          />
        </div>
      </div>
    </div>
  )
}
