import type OpenAI from "openai";
import type { ServiceContext } from "@/lib/services/context";
import { completeChat, type ChatUsage } from "./client";
import { CHAT_LIMITS } from "./config";
import { CHAT_COPY } from "./copy";
import type { ChatMessage, Conversation } from "./history";
import { toOpenAiTools, toolResultText, type McpBridge } from "./mcp-bridge";
import { createPendingAction, requiresConfirmation, type PendingAction } from "./pending-actions";
import { CHAT_SYSTEM_PROMPT } from "./system-prompt";

type ToolCall = OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall;

// Un listado grande devuelto por una tool se reenvía en cada vuelta: sin tope,
// un "listame todo" se come el cupo de tokens del mes.
const MAX_TOOL_RESULT_CHARS = 12_000;

export interface ChatTurnResult {
  reply: string;
  pendingActions: PendingAction[];
  usage: ChatUsage;
  toolCalls: number;
}

interface ChatTurnInput {
  ctx: ServiceContext;
  bridge: McpBridge;
  conversationId: string;
  conversation: Conversation;
  userMessage: string;
}

function parseArgs(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function executeCall(
  input: ChatTurnInput,
  call: ToolCall,
  pending: PendingAction[]
): Promise<string> {
  const args = parseArgs(call.function.arguments);
  if (!args) return "Los argumentos no son un JSON válido. Revisalos y reintentá.";

  const tool = input.bridge.tools.find((t) => t.name === call.function.name);
  if (!tool) return `La tool ${call.function.name} no existe.`;

  if (requiresConfirmation(tool)) {
    try {
      const action = await createPendingAction(input.ctx, {
        conversationId: input.conversationId,
        tool,
        args,
      });
      pending.push(action);
      const warnings = action.warnings.length > 0 ? ` La tarjeta le avisa: ${action.warnings.join(" ")}` : "";
      return `Quedó pendiente: el usuario tiene que tocar "Confirmar" en pantalla (${action.label}: ${action.description}).${warnings} Todavía NO se hizo.`;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  const result = await input.bridge.callTool(tool.name, args);
  return toolResultText(result).slice(0, MAX_TOOL_RESULT_CHARS);
}

/**
 * Una vuelta del chat: agrega el mensaje del usuario, llama al modelo y
 * ejecuta las tools que pida hasta que conteste con texto (o se pase de
 * vueltas). Muta `conversation.messages`; el que llama la guarda.
 */
export async function runChatTurn(input: ChatTurnInput): Promise<ChatTurnResult> {
  const { conversation } = input;
  const tools = toOpenAiTools(input.bridge.tools);
  const usage: ChatUsage = { promptTokens: 0, completionTokens: 0, costUsd: 0 };
  const pendingActions: PendingAction[] = [];
  let toolCalls = 0;

  conversation.messages.push({ role: "user", content: input.userMessage });

  for (let round = 0; round < CHAT_LIMITS.maxToolRounds; round++) {
    const prefix: ChatMessage[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "system", content: conversation.threadContext },
    ];
    const response = await completeChat([...prefix, ...conversation.messages], tools);
    usage.promptTokens += response.usage.promptTokens;
    usage.completionTokens += response.usage.completionTokens;
    usage.costUsd += response.usage.costUsd;

    const calls = (response.message.tool_calls ?? []).filter((c): c is ToolCall => c.type === "function");
    const text = response.message.content?.trim() ?? "";

    if (calls.length === 0) {
      // Cortada por el tope de salida: se avisa en vez de dejar el texto a la mitad.
      const reply = response.truncated && text ? `${text}…\n\n${CHAT_COPY.truncated}` : text;
      conversation.messages.push({ role: "assistant", content: reply });
      return { reply: reply || CHAT_COPY.errors.generic, pendingActions, usage, toolCalls };
    }

    conversation.messages.push({ role: "assistant", content: text || null, tool_calls: calls });
    toolCalls += calls.length;
    const results = await Promise.allSettled(calls.map((call) => executeCall(input, call, pendingActions)));
    calls.forEach((call, i) => {
      const result = results[i];
      conversation.messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: result.status === "fulfilled" ? result.value : "Error interno al ejecutar la tool.",
      });
    });
  }

  conversation.messages.push({ role: "assistant", content: CHAT_COPY.errors.toolLimit });
  return { reply: CHAT_COPY.errors.toolLimit, pendingActions, usage, toolCalls };
}
