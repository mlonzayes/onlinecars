import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/super-admin";
import { toFormValues } from "@/lib/blog-admin";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isSuperAdmin(userId)) notFound();

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Editar nota</h2>
      <BlogPostEditor postId={post.id} initialValues={toFormValues(post)} />
    </div>
  );
}
