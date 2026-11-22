import "server-only";
import OpenAI from "openai";
import { z } from "zod";
import { POST_CATEGORIES } from "@/data/post-types";
import { getChatApiKey, getChatBaseUrl, getChatModel } from "@/lib/chat/config";
import { BLOG_DRAFT_SYSTEM_PROMPT } from "@/lib/blog-ai-prompt";

/**
 * Borrador de una nota del blog con IA (mismo OpenRouter + modelo que el chat
 * del panel). Es un BORRADOR: llena el editor y nunca se publica solo. Donde
 * haría falta un dato real, el modelo deja "[DATO: …]" y el schema de la nota
 * no deja publicar hasta que se complete.
 */

export const blogDraftSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  excerpt: z.string().min(1).max(400),
  category: z.enum(POST_CATEGORIES).catch("operativa"),
  tldr: z.array(z.string()).max(5).catch([]),
  body: z.string().min(100),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).max(8).catch([]),
});

export type BlogDraft = z.infer<typeof blogDraftSchema>;

export interface InternalLink {
  title: string;
  path: string;
}

export class BlogDraftError extends Error {}

/** El modelo a veces envuelve el JSON en ```json … ```: nos quedamos con el objeto. */
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new BlogDraftError("La respuesta no trae JSON");
  return JSON.parse(text.slice(start, end + 1));
}

export async function generateBlogDraft(
  input: { topic: string; notes?: string },
  links: InternalLink[]
): Promise<{ draft: BlogDraft; costUsd: number }> {
  const client = new OpenAI({ baseURL: getChatBaseUrl(), apiKey: getChatApiKey() });

  const userMessage = [
    `Tema de la nota: ${input.topic}`,
    input.notes ? `Notas, datos y enfoque que tenés que usar:\n${input.notes}` : "No hay notas extra.",
    "Páginas del sitio que podés linkear (usá la ruta tal cual):",
    ...links.map((l) => `- ${l.title}: ${l.path}`),
  ].join("\n\n");

  const completion = await client.chat.completions.create({
    model: getChatModel(),
    messages: [
      { role: "system", content: BLOG_DRAFT_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    max_tokens: 6000,
    temperature: 0.6,
    // Campos de OpenRouter: no guardar ni entrenar con el prompt, y traer el costo.
    ...({ provider: { data_collection: "deny" }, usage: { include: true } } as object),
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new BlogDraftError("El modelo no devolvió texto");

  const parsed = blogDraftSchema.safeParse(extractJson(text));
  if (!parsed.success) throw new BlogDraftError("El borrador no tiene la forma esperada");

  const usage = completion.usage as (OpenAI.CompletionUsage & { cost?: number }) | undefined;
  return { draft: parsed.data, costUsd: usage?.cost ?? 0 };
}
