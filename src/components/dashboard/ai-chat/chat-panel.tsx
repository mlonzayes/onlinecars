"use client";

import { useEffect, useRef } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAiChat } from "@/hooks/use-ai-chat";
import { CHAT_COPY } from "@/lib/chat/copy";
import { ChatInput } from "./chat-input";
import { ChatMessageBubble } from "./chat-message-bubble";

export function ChatPanel() {
  const { messages, usage, sending, send, resolveAction, reset } = useAiChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Siempre mostrar lo último que llegó.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, sending]);

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <div className="flex items-baseline justify-between gap-3">
          <SheetTitle>{CHAT_COPY.title}</SheetTitle>
          {usage && (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {CHAT_COPY.usage(usage.used, usage.limit)}
            </span>
          )}
        </div>
        <SheetDescription>{CHAT_COPY.subtitle}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-3 overflow-y-auto px-4">
        {messages.length === 0 && !sending && (
          <p className="pt-6 text-sm text-muted-foreground">{CHAT_COPY.empty}</p>
        )}
        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} onResolveAction={resolveAction} />
        ))}
        {sending && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            {CHAT_COPY.thinking}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length > 0 && (
        <div className="px-3">
          <Button variant="ghost" size="sm" onClick={reset} disabled={sending} className="text-muted-foreground">
            <RotateCcw className="size-3.5" />
            {CHAT_COPY.newConversation}
          </Button>
        </div>
      )}
      <ChatInput disabled={sending} onSend={send} />
    </>
  );
}
