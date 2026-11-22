import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/super-admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BlogPostRowActions } from "@/components/admin/blog/blog-post-row-actions";
import { categoryLabel, POST_CATEGORIES, type PostCategory } from "@/data/post-types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const DATE_TIME = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

type PostState = "draft" | "scheduled" | "live";

const STATE_BADGE: Record<PostState, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "bg-gray-200 text-gray-700" },
  scheduled: { label: "Programada", className: "bg-amber-100 text-amber-800" },
  live: { label: "Publicada", className: "bg-emerald-100 text-emerald-800" },
};

// Notas del blog de la web principal. El guard vive en el layout; se repite acá
// por defense in depth, igual que en /admin/sitios.
export default async function AdminBlogPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!isSuperAdmin(userId)) notFound();

  const posts = await prisma.blogPost.findMany({
    select: { id: true, title: true, slug: true, category: true, status: true, publishedAt: true },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { updatedAt: "desc" }],
  });

  const now = Date.now();
  const stateOf = (p: (typeof posts)[number]): PostState =>
    p.status !== "published" || !p.publishedAt ? "draft" : p.publishedAt.getTime() > now ? "scheduled" : "live";

  // Lo que importa para sostener 2-3 notas por semana: qué sale en los próximos 7 días.
  const nextWeek = posts.filter((p) => stateOf(p) === "scheduled" && p.publishedAt!.getTime() <= now + WEEK_MS).length;
  const cards = [
    { label: "Publicadas", value: posts.filter((p) => stateOf(p) === "live").length },
    { label: "Salen en los próximos 7 días", value: nextWeek },
    { label: "Borradores", value: posts.filter((p) => stateOf(p) === "draft").length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-1">
              <CardDescription>{c.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Notas del blog</h2>
          <p className="text-sm text-muted-foreground">
            Las programadas salen solas en su fecha, con hasta 1 hora de demora.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/blog/nueva" />}>
          Nueva nota
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nota</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                Todavía no hay notas.
              </TableCell>
            </TableRow>
          )}
          {posts.map((p) => {
            const state = stateOf(p);
            const badge = STATE_BADGE[state];
            const category = (POST_CATEGORIES as readonly string[]).includes(p.category)
              ? categoryLabel(p.category as PostCategory)
              : p.category;
            return (
              <TableRow key={p.id}>
                <TableCell className="max-w-md">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="truncate text-xs text-muted-foreground">/blog/{p.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge className={badge.className}>{badge.label}</Badge>
                  {p.publishedAt && state !== "draft" && (
                    <p className="mt-1 text-xs text-muted-foreground">{DATE_TIME.format(p.publishedAt)}</p>
                  )}
                </TableCell>
                <TableCell>{category}</TableCell>
                <TableCell>
                  <BlogPostRowActions id={p.id} title={p.title} publicHref={state === "live" ? `/blog/${p.slug}` : null} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
