/**
 * PUT    /api/admin/blog/[id] → super-admin edita una nota (mismo body que el POST).
 * DELETE /api/admin/blog/[id] → super-admin borra una nota.
 *
 * PUT response:    { "data": { "id": "cmx...", "slug": "como-tasar-un-usado" } }
 * DELETE response: { "data": { "id": "cmx..." } }
 * 404:             { "error": "Nota no encontrada" }
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { blogPostSchema } from "@/lib/validators/blog-post";
import { denyUnlessSuperAdmin, isSlugTaken, toBlogPostData } from "@/lib/blog-admin";
import { invalidateBlogPosts } from "@/lib/blog-posts";

type RouteParams = { id: string };

const NOT_FOUND = { error: "Nota no encontrada" };

export const PUT = withLogger<RouteParams>(async (request, { requestId, params }) => {
  const denied = await denyUnlessSuperAdmin(requestId, "admin.blog.update");
  if (denied) return denied;

  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const exists = await prisma.blogPost.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!exists) return NextResponse.json(NOT_FOUND, { status: 404 });

  try {
    const updated = await prisma.blogPost.update({
      where: { id: params.id },
      data: toBlogPostData(parsed.data),
      select: { id: true, slug: true, status: true },
    });
    invalidateBlogPosts();
    logger.info(requestId, "admin.blog.updated", updated);
    return NextResponse.json({ data: { id: updated.id, slug: updated.slug } });
  } catch (error) {
    if (isSlugTaken(error)) {
      return NextResponse.json({ error: "Ya hay una nota con esa URL" }, { status: 409 });
    }
    throw error;
  }
});

export const DELETE = withLogger<RouteParams>(async (_request, { requestId, params }) => {
  const denied = await denyUnlessSuperAdmin(requestId, "admin.blog.delete");
  if (denied) return denied;

  const { count } = await prisma.blogPost.deleteMany({ where: { id: params.id } });
  if (count === 0) return NextResponse.json(NOT_FOUND, { status: 404 });

  invalidateBlogPosts();
  logger.info(requestId, "admin.blog.deleted", { id: params.id });
  return NextResponse.json({ data: { id: params.id } });
});
