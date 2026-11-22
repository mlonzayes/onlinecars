import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/super-admin";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";
import { emptyBlogPost, type BlogAuthorDefaults } from "@/components/admin/blog/blog-editor-types";

export default async function NewBlogPostPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isSuperAdmin(userId)) notFound();

  // El autor arranca con el de la última nota: casi siempre escribe el mismo.
  const last = await prisma.blogPost.findFirst({
    orderBy: { createdAt: "desc" },
    select: { authorName: true, authorInitials: true, authorType: true, authorUrl: true },
  });
  const author: BlogAuthorDefaults = {
    authorName: last?.authorName ?? "",
    authorInitials: last?.authorInitials ?? "",
    authorType: last?.authorType === "Organization" ? "Organization" : "Person",
    authorUrl: last?.authorUrl ?? null,
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Nueva nota</h2>
      <BlogPostEditor initialValues={emptyBlogPost(author)} />
    </div>
  );
}
