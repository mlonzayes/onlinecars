/**
 * POST /api/admin/blog/draft → super-admin pide un borrador de nota a la IA.
 * No guarda nada: devuelve el borrador para llenar el editor.
 *
 * POST request:  { "topic": "Cómo tasar un usado", "notes": "Usamos la guía de precios de…" }
 * POST response: { "data": { "title": "…", "slug": "…", "excerpt": "…", "category": "operativa",
 *                            "tldr": ["…"], "body": "## …", "faqs": [{ "question": "…", "answer": "…" }] } }
 * 503: la IA no está configurada (OPENROUTER_API_KEY / AI_CHAT_MODEL)
 * 502: el modelo falló o devolvió algo que no se pudo leer
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { isChatEnabled } from "@/lib/chat/config";
import { blogDraftRequestSchema } from "@/lib/validators/blog-post";
import { denyUnlessSuperAdmin } from "@/lib/blog-admin";
import { generateBlogDraft, type InternalLink } from "@/lib/blog-ai-draft";

// Un borrador largo puede tardar más que el default de algunas funciones.
export const maxDuration = 120;

const COMMERCIAL_PAGES: InternalLink[] = [
  { title: "Software de gestión para concesionarias", path: "/software-para-concesionarias" },
  { title: "Precios y planes", path: "/precios" },
];

export const POST = withLogger(async (request, { requestId }) => {
  const denied = await denyUnlessSuperAdmin(requestId, "admin.blog.draft");
  if (denied) return denied;

  if (!isChatEnabled()) {
    return NextResponse.json({ error: "La IA no está configurada en este entorno" }, { status: 503 });
  }

  const parsed = blogDraftRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  // Notas ya publicadas, para que el borrador linkee dentro del blog.
  const published = await prisma.blogPost.findMany({
    where: { status: "published", publishedAt: { lte: new Date() } },
    select: { title: true, slug: true },
    orderBy: { publishedAt: "desc" },
    take: 40,
  });
  const links = [...COMMERCIAL_PAGES, ...published.map((p) => ({ title: p.title, path: `/blog/${p.slug}` }))];

  try {
    const { draft, costUsd } = await generateBlogDraft(parsed.data, links);
    logger.info(requestId, "admin.blog.draft.ok", { costUsd, bodyChars: draft.body.length });
    return NextResponse.json({ data: draft });
  } catch (error) {
    logger.error(requestId, "admin.blog.draft.failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "No se pudo generar el borrador. Probá de nuevo." }, { status: 502 });
  }
});
