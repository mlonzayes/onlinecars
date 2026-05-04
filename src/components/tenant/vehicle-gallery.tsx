"use client";

import { useState } from "react";
import Image from "next/image";
import { Car, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { VehicleImage } from "@prisma/client";

interface VehicleGalleryProps {
  images: VehicleImage[];
  title: string;
}

export function VehicleGallery({ images, title }: VehicleGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl bg-gray-100">
        <Car className="h-20 w-20 text-gray-300" />
      </div>
    );
  }

  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;

  function goPrev() {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }

  function goNext() {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }

  return (
    <div className="space-y-3">
      {/* Main Image — click para abrir lightbox */}
      <div className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-gray-100">
        <Dialog>
          <DialogTrigger
            className="block h-full w-full cursor-zoom-in"
            aria-label="Ampliar imagen"
          >
            <div className="relative h-full w-full">
              <Image
                src={activeImage.url}
                alt={activeImage.alt ?? title}
                fill
                className="object-cover transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            </div>
          </DialogTrigger>

          {/* Lightbox: fondo oscuro, imagen contain a tamaño grande */}
          <DialogContent
            className="!max-w-[95vw] border-0 bg-transparent p-0 shadow-none ring-0 sm:!max-w-[90vw]"
          >
            <div className="relative flex h-[85vh] w-full items-center justify-center">
              <Image
                src={activeImage.url}
                alt={activeImage.alt ?? title}
                fill
                className="object-contain"
                sizes="95vw"
                priority
              />

              {/* Navegación dentro del lightbox */}
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {activeIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Navigation arrows sobre la imagen principal (fuera del lightbox).
            Detenemos la propagación así no abren el lightbox al navegar. */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 shadow-lg backdrop-blur-sm transition-all hover:bg-white group-hover:opacity-100"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 opacity-0 shadow-lg backdrop-blur-sm transition-all hover:bg-white group-hover:opacity-100"
              aria-label="Siguiente imagen"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                index === activeIndex
                  ? "border-[var(--tenant-primary)] shadow-md"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Ver imagen ${index + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `${title} - imagen ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
