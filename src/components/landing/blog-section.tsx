import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import { FadeIn } from "./fade-in";
import { BlogCard } from "./blog-card";
import { type BlogPost } from "@/data/posts";

interface BlogSectionProps {
  posts: BlogPost[];
}

export function BlogSection({ posts }: BlogSectionProps) {
  return (
    <section id="blog" className="bg-gray-50 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
              Blog
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              Notas y guías
            </h2>
            <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-gray-500">
              Recursos para vender mejor, gestionar stock con menos fricción y
              aprovechar todo lo que tu concesionario puede hacer online.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="shrink-0">
            <Link
              href="/blog"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
            >
              Ver todas las notas
              <PiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </FadeIn>
        </div>

        <FadeIn stagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
