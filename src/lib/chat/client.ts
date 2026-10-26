import "server-only";
import OpenAI from "openai";
import { getChatApiKey, getChatBaseUrl, getChatModel, CHAT_LIMITS } from "./config";

type ChatParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

// Campos propios de OpenRouter que no están en los tipos del SDK de OpenAI.
// Viajan igual en el body: el SDK serializa todo lo que recibe.
interface OpenRouterParams extends ChatParams {
  provider: {
    // Excluye a los proveedores que guardan los prompts o entrenan con ellos.
    // Por el chat pasan datos de clientes y consultas: esto no es opcional.
    data_collection: "deny";
    // Solo proveedores que soportan todos los parámetros que mandamos (tools).
    require_parameters: true;
  };
  // Pide que la respuesta traiga el costo real en `usage.cost`.
  usage: { include: true };
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
  // USD según OpenRouter. 0 si el proveedor no lo informó.
  costUsd: number;
}

/** Error del proveedor que llega dentro de una respuesta 200 de OpenRouter. */
export class ChatProviderError extends Error {
  constructor(
    readonly code: number | null,
    message: string
  ) {
    super(message);
    this.name = "ChatProviderError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  client ??= new OpenAI({ baseURL: getChatBaseUrl(), apiKey: getChatApiKey() });
  return client;
}

export async function completeChat(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  model: string = getChatModel()
): Promise<{ message: OpenAI.Chat.Completions.ChatCompletionMessage; truncated: boolean; usage: ChatUsage }> {
  const params: OpenRouterParams = {
    model,
    messages,
    tools,
    tool_choice: "auto",
    max_tokens: CHAT_LIMITS.maxOutputTokens,
    temperature: 0.2,
    provider: { data_collection: "deny", require_parameters: true },
    usage: { include: true },
  };
  const completion = await getClient().chat.completions.create(params);

  // OpenRouter a veces contesta 200 con `error` y sin `choices` (falló el
  // proveedor de atrás). Sin esto explota leyendo choices[0] y se pierde el motivo.
  const raw = completion as unknown as { choices?: unknown[]; error?: { code?: number; message?: string } };
  if (raw.error || !Array.isArray(raw.choices)) {
    throw new ChatProviderError(raw.error?.code ?? null, raw.error?.message ?? "Respuesta sin choices");
  }

  const choice = completion.choices[0];
  if (!choice) throw new ChatProviderError(null, "El modelo no devolvió ninguna respuesta");

  const usage = completion.usage as (OpenAI.CompletionUsage & { cost?: number }) | undefined;
  return {
    message: choice.message,
    // true = el modelo chocó con max_tokens y el texto quedó cortado.
    truncated: choice.finish_reason === "length",
    usage: {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      costUsd: usage?.cost ?? 0,
    },
  };
}
