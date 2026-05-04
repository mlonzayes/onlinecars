import Link from "next/link";
import { ArrowUpRight, Search, Tag } from "lucide-react";

interface DualCTAProps {
  basePath: string;
}

// Sección de doble CTA: enganche al usuario preguntándole qué busca.
// Card izquierda → comprar (catálogo). Card derecha → vender (form de cotización).
export function DualCTA({ basePath }: DualCTAProps) {
  return (
    <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
      {/* Comprar */}
      <div className="group relative overflow-hidden rounded-3xl bg-slate-50 p-8 sm:p-10">
        <div className="relative z-10 max-w-md">
          <h3 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            ¿Estás buscando
            <br />
            tu próximo auto?
          </h3>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Recorré nuestro stock completo y filtrá por marca, condición o presupuesto
            para encontrar el ideal.
          </p>
          <Link
            href={`${basePath}/catalogo`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--tenant-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Ver catálogo
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Decoración: ícono grande detrás del contenido */}
        <Search
          className="pointer-events-none absolute -right-6 -bottom-6 h-44 w-44 text-[var(--tenant-primary)] opacity-10 sm:h-52 sm:w-52"
          strokeWidth={1.5}
        />
      </div>

      {/* Vender */}
      <div className="group relative overflow-hidden rounded-3xl bg-slate-900 p-8 sm:p-10">
        <div className="relative z-10 max-w-md">
          <h3 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
            ¿Querés vender
            <br />
            tu auto?
          </h3>
          <p className="mt-3 text-sm text-slate-300 sm:text-base">
            Cotizá con nosotros. Te ofrecemos un precio justo y un proceso simple,
            sin perder tiempo.
          </p>
          <Link
            href={`${basePath}/cotizar`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Cotizar mi auto
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Decoración */}
        <Tag
          className="pointer-events-none absolute -right-6 -bottom-6 h-44 w-44 text-white opacity-10 sm:h-52 sm:w-52"
          strokeWidth={1.5}
        />
      </div>
    </div>
  );
}
