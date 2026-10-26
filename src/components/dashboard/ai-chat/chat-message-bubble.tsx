"use client";

import { cn } from "@/lib/utils";
import type { ChatUiMessage } from "@/hooks/use-ai-chat";
import { PendingActionCard } from "./pending-action-card";

interface ChatMessageBubbleProps {
  message: ChatUiMessage;
  onResolveAction: (id: string, decision: "confirm" | "cancel") => Promise<{ ok: boolean; message: string }>;
}

export function ChatMessageBubble({ message, onResolveAction }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-2xl rounded-bl-sm bg-muted text-foreground",
          message.isError && "bg-destructive/10 text-destructive"
        )}
      >
        {message.content}
        {message.pendingActions?.map((action) => (
          <PendingActionCard key={action.id} action={action} onResolve={onResolveAction} />
        ))}
      </div>
    </div>
  );
}
