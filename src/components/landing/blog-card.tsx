import Image from "next/image";
import Link from "next/link";
import { type BlogPost, categoryLabel } from "@/data/posts";

interface BlogCardProps {
  post: BlogPost;
  /** Si es 'featured' la card es más grande (usado en el primer post del listado) */
  variant?: "default" | "featured";
}

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(`${iso}T00:00:00`));
}

export function BlogCard({ post, variant = "default" }: BlogCardProps) {
  const isFeatured = variant === "featured";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 ${
        isFeatured ? "sm:flex-row" : ""
      }`}
    >
      {/* Cover: Image real si coverImage está presente, sino gradient placeholder */}
      <div
        className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 ${
          isFeatured ? "aspect-video sm:aspect-auto sm:w-2/5" : "aspect-video"
        }`}
      >
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes={isFeatured ? "(max-width: 640px) 100vw, 40vw" : "(max-width: 640px) 100vw, 33vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // Pattern decorativo cuando no hay imagen
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, white 0%, transparent 40%), radial-gradient(circle at 80% 70%, white 0%, transparent 40%)",
            }}
          />
        )}
        <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
          {categoryLabel(post.category)}
        </span>
      </div>

      <div className={`flex flex-1 flex-col p-5 ${isFeatured ? "sm:p-6" : ""}`}>
        <h3
          className={`font-bold text-gray-900 transition-colors group-hover:text-blue-700 ${
            isFeatured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
          }`}
        >
          {post.title}
        </h3>
        <p
          className={`mt-2 leading-relaxed text-gray-500 ${
            isFeatured ? "text-sm sm:text-base" : "text-xs sm:text-sm"
          }`}
        >
          {post.excerpt}
        </p>

        {/* mt-auto empuja el footer al fin de la card aunque el excerpt sea corto */}
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-gray-500">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
            {post.authorInitials}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-medium text-gray-700">{post.authorName}</span>
            <span className="text-gray-300">·</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span className="text-gray-300">·</span>
            <span>{post.readingMinutes} min</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
