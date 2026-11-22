import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { BlogPost as BlogPostRow, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { isSuperAdmin } from "@/lib/super-admin";
import { toArDate } from "@/lib/blog-posts";
import { arLocalToDate, type BlogPostFormValues } from "@/lib/validators/blog-post";

/**
 * Piezas compartidas por /api/admin/blog/* y las pages de /admin/blog.
 * El blog es de la plataforma: no hay dealershipId, el único guard es super-admin.
 */

/** null si es super-admin; si no, la respuesta 403 lista para devolver. */
export async function denyUnlessSuperAdmin(requestId: string, event: string): Promise<NextResponse | null> {
  const { userId } = await auth();
  if (userId && isSuperAdmin(userId)) return null;
  logger.warn(requestId, `${event}.forbidden`, { userId });
  return NextResponse.json({ error: "No autorizado" }, { status: 403 });
}

/** Valores validados del editor → datos de Prisma. */
export function toBlogPostData(v: BlogPostFormValues): Prisma.BlogPostCreateInput {
  return {
    slug: v.slug,
    title: v.title,
    excerpt: v.excerpt,
    category: v.category,
    body: v.body,
    tldr: v.tldr,
    faqs: v.faqs,
    sources: v.sources,
    coverImage: v.coverImage,
    authorName: v.authorName,
    authorInitials: v.authorInitials.toUpperCase(),
    authorType: v.authorType,
    authorUrl: v.authorUrl,
    status: v.status,
    publishedAt: v.publishAt ? arLocalToDate(v.publishAt) : null,
    contentUpdatedAt: v.contentUpdatedOn ? arLocalToDate(`${v.contentUpdatedOn}T12:00`) : null,
  };
}

const AR_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Argentina/Buenos_Aires",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23", // con hour12:false algunos runtimes devuelven "24:05"
});

/** Date → "YYYY-MM-DDTHH:mm" en hora argentina, para el datetime-local. */
export function toArLocalInput(date: Date): string {
  return `${toArDate(date)}T${AR_TIME.format(date)}`;
}

function asArray<T>(value: Prisma.JsonValue, guard: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? (value as unknown[]).filter(guard) : [];
}

const isFaq = (x: unknown): x is { question: string; answer: string } =>
  typeof x === "object" && x !== null && "question" in x && "answer" in x;
const isSource = (x: unknown): x is { label: string; url: string } =>
  typeof x === "object" && x !== null && "label" in x && "url" in x;

/**
 * Fila → valores iniciales del editor. Tipado laxo a propósito en category y
 * authorType (string): si la DB tiene algo viejo, el Select lo muestra y el
 * schema lo rechaza al guardar, en vez de reventar al abrir la nota.
 */
export function toFormValues(row: BlogPostRow): BlogPostFormValues {
  return {
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    category: row.category as BlogPostFormValues["category"],
    body: row.body,
    tldr: row.tldr,
    faqs: asArray(row.faqs, isFaq),
    sources: asArray(row.sources, isSource),
    coverImage: row.coverImage,
    authorName: row.authorName,
    authorInitials: row.authorInitials,
    authorType: row.authorType as BlogPostFormValues["authorType"],
    authorUrl: row.authorUrl,
    status: row.status as BlogPostFormValues["status"],
    publishAt: row.publishedAt ? toArLocalInput(row.publishedAt) : null,
    contentUpdatedOn: row.contentUpdatedAt ? toArDate(row.contentUpdatedAt) : null,
  };
}

/** Prisma P2002 sobre el slug → mensaje para el editor. */
export function isSlugTaken(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
