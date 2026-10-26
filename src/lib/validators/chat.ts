import { z } from "zod";
import { CHAT_LIMITS } from "@/lib/chat/config";

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1, "Escribí un mensaje").max(CHAT_LIMITS.maxInputChars, "El mensaje es muy largo"),
});

export const chatActionDecisionSchema = z.object({
  decision: z.enum(["confirm", "cancel"]),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
