// Config del chat con IA del panel. SERVER-ONLY: la key de OpenRouter es un
// secreto y nunca lleva prefijo NEXT_PUBLIC.
//
// La PRESENCIA de OPENROUTER_API_KEY + AI_CHAT_MODEL es el interruptor (mismo
// criterio que el pixel y el MCP): sin alguna de las dos el chat no existe,
// aunque el dealer tenga cupo. No hay modelo por defecto a propósito: el que se
// usa sale del eval, no de un valor que alguien dejó en el código.

export function isChatEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY && process.env.AI_CHAT_MODEL);
}

export function getChatApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY no está configurada");
  return key;
}

// Slug de OpenRouter (ej: "google/gemini-2.5-flash-lite"). Se elige con el eval
// de evals/chat y se cambia sin tocar código.
export function getChatModel(): string {
  const model = process.env.AI_CHAT_MODEL;
  if (!model) throw new Error("AI_CHAT_MODEL no está configurada");
  return model;
}

// Techo duro de tokens (entrada + salida) por dealer y por mes. Es la red de
// seguridad del costo: el cupo de mensajes no alcanza porque un mensaje largo
// con varias tools cuesta más que diez cortos. Vacío = sin techo.
export function getMonthlyTokenCap(): number {
  const raw = Number(process.env.AI_CHAT_MONTHLY_TOKEN_CAP);
  return Number.isFinite(raw) && raw > 0 ? raw : Infinity;
}

// Paquetes de mensajes por mes que se venden (el super-admin elige uno desde
// /admin). 0 = no contratado. Cambiar acá no toca a quien ya tiene uno asignado.
export const AI_CHAT_PACKAGES = [0, 300, 1000, 3000] as const;

export const CHAT_LIMITS = {
  // Largo máximo de un mensaje del usuario. Corta el "pegame este texto y..."
  maxInputChars: 1000,
  // Mensajes del historial que se reenvían al modelo. Más historial = cada
  // mensaje nuevo cuesta más.
  maxHistoryMessages: 20,
  // Vueltas de tools por mensaje. Corta los loops del modelo antes de que
  // quemen plata.
  maxToolRounds: 5,
  maxOutputTokens: 800,
  conversationTtlSeconds: 60 * 60 * 24,
  pendingActionTtlSeconds: 60 * 10,
} as const;
