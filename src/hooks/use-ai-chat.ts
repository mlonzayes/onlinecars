"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_COPY } from "@/lib/chat/copy";
import type { ChatDisplayMessage } from "@/lib/chat/display";
import type { PendingActionView } from "@/lib/chat/pending-actions";

// Estado del chat del panel. La conversación vive en el server (Redis); acá
// solo se guarda su id en sessionStorage para retomarla al reabrir el panel.

const STORAGE_KEY = "motorflow:ai-chat:conversation";

export interface ChatUiMessage extends ChatDisplayMessage {
  id: string;
  pendingActions?: PendingActionView[];
  isError?: boolean;
}

interface ChatUsage {
  used: number;
  limit: number;
}

function readStoredId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(STORAGE_KEY, id);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin storage (modo privado): el chat anda igual, solo no se retoma.
  }
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? CHAT_COPY.errors.generic;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [usage, setUsage] = useState<ChatUsage | null>(null);
  const [sending, setSending] = useState(false);
  const conversationId = useRef<string | null>(null);

  const push = useCallback((message: Omit<ChatUiMessage, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: globalThis.crypto.randomUUID() }]);
  }, []);

  // Al abrir el panel: uso del mes + la conversación en curso, si la hay.
  useEffect(() => {
    const storedId = readStoredId();
    conversationId.current = storedId;
    const query = storedId ? `?conversationId=${encodeURIComponent(storedId)}` : "";
    fetch(`/api/chat${query}`)
      .then(async (res) => {
        if (!res.ok) return;
        const { data } = (await res.json()) as { data: { usage: ChatUsage; messages: ChatDisplayMessage[] } };
        setUsage(data.usage);
        if (data.messages.length === 0) storeId(null);
        setMessages(data.messages.map((m) => ({ ...m, id: globalThis.crypto.randomUUID() })));
      })
      .catch(() => undefined);
  }, []);

  const send = useCallback(
    async (text: string) => {
      push({ role: "user", content: text });
      setSending(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, conversationId: conversationId.current ?? undefined }),
        });
        if (!res.ok) {
          push({ role: "assistant", content: await readError(res), isError: true });
          return;
        }
        const { data } = (await res.json()) as {
          data: { conversationId: string; reply: string; pendingActions: PendingActionView[]; usage: ChatUsage };
        };
        conversationId.current = data.conversationId;
        storeId(data.conversationId);
        setUsage(data.usage);
        push({ role: "assistant", content: data.reply, pendingActions: data.pendingActions });
      } catch {
        push({ role: "assistant", content: CHAT_COPY.errors.generic, isError: true });
      } finally {
        setSending(false);
      }
    },
    [push]
  );

  // Devuelve el texto a mostrar en la tarjeta una vez resuelta.
  const resolveAction = useCallback(async (actionId: string, decision: "confirm" | "cancel") => {
    try {
      const res = await fetch(`/api/chat/acciones/${actionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) return { ok: false, message: await readError(res) };
      const { data } = (await res.json()) as { data: { ok: boolean; message: string } };
      return data;
    } catch {
      return { ok: false, message: CHAT_COPY.errors.generic };
    }
  }, []);

  const reset = useCallback(() => {
    conversationId.current = null;
    storeId(null);
    setMessages([]);
  }, []);

  return { messages, usage, sending, send, resolveAction, reset };
}
