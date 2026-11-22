/**
 * POST /api/admin/blog → super-admin crea una nota del blog.
 *
 * El listado no tiene GET: la page /admin/blog lee directo de la DB (Server Component).
 *
 * POST request:  { "title": "Cómo tasar un usado", "slug": "como-tasar-un-usado",
 *                  "excerpt": "…", "category": "operativa", "body": "## …",
 *                  "tldr": ["…"], "faqs": [], "sources": [], "coverImage": null,
 *                  "authorName": "Mateo Lonzayes", "authorInitials": "ML",
 *                  "authorType": "Person", "authorUrl": null,
 *                  "status": "published", "publishAt": "2026-11-25T09:00",
 *                  "contentUpdatedOn": null }
 * POST response 201: { "data": { "id": "cmx...", "slug": "como-tasar-un-usado" } }
 * POST response 409: { "error": "Ya hay una nota con esa URL" }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { blogPostSchema } from "@/lib/validators/blog-post";
import { denyUnlessSuperAdmin, isSlugTaken, toBlogPostData } from "@/lib/blog-admin";
import { invalidateBlogPosts } from "@/lib/blog-posts";

export const POST = withLogger(async (request, { requestId }) => {
  const denied = await denyUnlessSuperAdmin(requestId, "admin.blog.create");
  if (denied) return denied;

  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await prisma.blogPost.create({
      data: toBlogPostData(parsed.data),
      select: { id: true, slug: true, status: true },
    });
    invalidateBlogPosts();
    logger.info(requestId, "admin.blog.created", created);
    return NextResponse.json({ data: { id: created.id, slug: created.slug } }, { status: 201 });
  } catch (error) {
    if (isSlugTaken(error)) {
      return NextResponse.json({ error: "Ya hay una nota con esa URL" }, { status: 409 });
    }
    throw error;
  }
});
