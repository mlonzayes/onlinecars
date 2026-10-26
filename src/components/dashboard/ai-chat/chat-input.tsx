"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_LIMITS } from "@/lib/chat/config";
import { CHAT_COPY } from "@/lib/chat/copy";

interface ChatInputProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

// Enter envía, Shift+Enter hace salto de línea.
export function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const nearLimit = text.length > CHAT_LIMITS.maxInputChars * 0.8;

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="border-t p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={CHAT_COPY.placeholder}
          maxLength={CHAT_LIMITS.maxInputChars}
          rows={2}
          className="min-h-0 resize-none"
          aria-label={CHAT_COPY.placeholder}
        />
        <Button type="submit" size="icon" disabled={disabled || !trimmed} aria-label={CHAT_COPY.send}>
          {disabled ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
        </Button>
      </div>
      {nearLimit && (
        <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">
          {text.length}/{CHAT_LIMITS.maxInputChars}
        </p>
      )}
    </form>
  );
}
