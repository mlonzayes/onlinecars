"use client";

import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import { ScrollReveal } from "./scroll-reveal";
import { TextReveal } from "./text-reveal";
import { FloatingOrbs } from "./floating-orbs";
import { BlogCard } from "./blog-card";
import { type BlogPost } from "@/data/posts";

interface BlogSectionProps {
  posts: BlogPost[];
}

export function BlogSection({ posts }: BlogSectionProps) {
  return (
    <section
      id="blog"
      className="relative overflow-hidden bg-gray-50 px-4 py-14 sm:py-16"
    >
      <FloatingOrbs
        orbs={[
          { top: "10%", left: "78%", size: 280, color: "bg-blue-200/20", duration: 22 },
          { top: "65%", left: "8%", size: 220, color: "bg-indigo-200/15", duration: 18, delay: 1 },
        ]}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              <TextReveal stagger={0.04}>Notas y guías</TextReveal>
            </h2>
            <ScrollReveal y={15} blur={3} delay={0.2}>
              <p className="mt-2 max-w-xl text-sm text-gray-500 sm:text-base">
                Recursos para vender mejor, gestionar stock con menos fricción y
                aprovechar todo lo que tu concesionario puede hacer online.
              </p>
            </ScrollReveal>
          </div>

          <ScrollReveal x={20} y={0} delay={0.3}>
            <Link
              href="/blog"
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800"
            >
              Ver todas las notas
              <PiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <ScrollReveal
              key={post.slug}
              y={20}
              x={i % 2 === 0 ? -10 : 10}
              scale={0.97}
              duration={0.7}
              delay={i * 0.1}
              ease="back.out(1.2)"
              className="h-full"
            >
              <BlogCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
