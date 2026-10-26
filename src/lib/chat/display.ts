import type { ChatMessage } from "./history";

// Lo que la UI muestra de una conversación guardada: solo los textos del
// usuario y del asistente. Las llamadas a tools y sus resultados quedan en el
// server.

export interface ChatDisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export function toDisplayMessages(messages: ChatMessage[]): ChatDisplayMessage[] {
  const out: ChatDisplayMessage[] = [];
  for (const m of messages) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string" || !m.content.trim()) continue;
    out.push({ role: m.role, content: m.content });
  }
  return out;
}
