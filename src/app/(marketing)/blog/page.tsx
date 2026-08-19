import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { BlogCard } from "@/components/landing/blog-card";
import { getAllPosts } from "@/data/posts";

export const metadata: Metadata = {
  title: "Notas y guías — motorflow",
  description:
    "Recursos para concesionarios: vender más, gestionar stock con menos fricción y aprovechar todo lo que motorflow puede hacer.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 px-4 pb-14 pt-28">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <header className="text-center">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
              Blog
            </span>
            <h1 className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Notas y guías
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500 sm:text-base">
              Recursos prácticos para que tu concesionario venda mejor y opere
              con menos fricción. Actualizamos semanalmente.
            </p>
          </header>

          {/* Featured (primer post, layout horizontal) */}
          {featured && (
            <div className="mt-10">
              <BlogCard post={featured} variant="featured" />
            </div>
          )}

          {/* Resto en grid */}
          {rest.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          )}

          {/* Empty state si no hay posts */}
          {posts.length === 0 && (
            <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <p className="font-medium text-gray-700">
                Todavía no publicamos nada
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Estamos preparando las primeras notas. Volvé pronto.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
