'use client'

import { useState, useRef, useEffect } from "react"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { Switch } from "../ui/switch"
import { cn } from "@/lib/utils"
import { MoreHorizontal, PanelLeft, Plus, Share2 } from "lucide-react"
import { Label } from "../ui/label"
import { useMediaQuery } from "@/hooks/use-media-query"
import { toast } from "sonner"
import { useSidebarStore } from "@/stores/sidebar-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import Link from "next/link"
import { useConversationsContext } from '@/components/providers/conversations-provider'
import type { ConversationMode } from '@/app/chat/page'

interface ConversationSidebarProps {
  onModeChange?: (mode: ConversationMode) => void
}

export function ConversationSidebar({ onModeChange }: ConversationSidebarProps) {
  const { conversations, activeConversation, shareConversation } = useConversationsContext()
  const [mode, setMode] = useState<ConversationMode>("conversation")
  const { close } = useSidebarStore()
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Map conversations to the format expected by the UI
  const conversationItems = conversations.map(conv => ({
    id: conv.id,
    title: conv.title,
    href: `/chat/${conv.id}`,
    active: activeConversation?.id === conv.id
  }))

  const handleModeChange = (newMode: ConversationMode) => {
    setMode(newMode)
    onModeChange?.(newMode)
  }

  return (
    <div className="flex flex-col h-full bg-background md:bg-[#efefef]">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 justify-between">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" className="h-[2.5rem] w-[5rem]" alt="" />
        </div>
        <Button
          variant="default"
          size="icon"
          onClick={close}
          className="h-8 w-8 bg-[#573dff24] text-primary"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Mode Controls */}
      <div className="flex-none p-4 border-b">
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mode-toggle" className="text-sm font-medium">
              Mode
            </Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {mode === "conversation" ? "Conversation" : "Challenge"}
              </span>
              <Switch
                id="mode-toggle"
                checked={mode === "challenge"}
                onCheckedChange={(checked) =>
                  handleModeChange(checked ? "challenge" : "conversation")
                }
              />
            </div>
          </div>

          <Link
            href="/chat"
            className={cn(
              "group flex items-center gap-3 pl-2.5 py-2 text-sm transition-colors outline-none rounded-md border border-dashed",
              "hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-sm">
              {mode === "challenge" ? "New Challenge" : "New Conversation"}
            </span>
          </Link>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="pl-2 pt-2">
            <h2 className="text-xs font-medium text-gray-500 mb-1">Recent Chats</h2>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            {conversationItems.map((conversation) => (
              <Link
                key={conversation.id}
                href={conversation.href}
                className={cn(
                  "group flex items-center gap-3 pl-2.5 py-1.5 text-sm transition-colors outline-none rounded-md",
                  conversation.active
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span className="truncate flex-1">{conversation.title}</span>
                <div className="opacity-0 group-hover:opacity-100 pr-1 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          shareConversation(conversation.id)
                          toast.success('Link copied to clipboard!', {
                            description: 'Anyone with this link can now view this conversation'
                          })
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive text-red-500"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (window.confirm('Are you sure you want to delete this conversation?')) {
                            // deleteConversation(conversation.id);
                          }
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}