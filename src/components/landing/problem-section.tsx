import Image from "next/image";
import { PiStorefront, PiGlobe, PiListDashes } from "react-icons/pi";
import { FadeIn } from "./fade-in";

// Banda OSCURA a propósito: la sección "problema" es el punto emocional bajo del
// relato (dolor del concesionario). El contraste con las secciones claras de
// arriba/abajo la resalta, y las fotos cinematográficas refuerzan cada dolor.
const PROBLEMS = [
  {
    Icon: PiStorefront,
    image: "/premium_images/P2_dependencia.png",
    title: "Todo pasa por MercadoLibre",
    description:
      "Dependés de un portal que cambia tarifas y reglas cuando quiere. Si mañana te conviene menos, no tenés alternativa propia.",
  },
  {
    Icon: PiGlobe,
    image: "/premium_images/P3_invisibilidad.png",
    title: "Sin identidad digital propia",
    description:
      "Tus clientes te buscan en Google y no te encuentran. Tu marca no existe fuera de los portales de terceros.",
  },
  {
    Icon: PiListDashes,
    image: "/premium_images/P4_caos_operativo.png",
    title: "El caos operativo",
    description:
      "Stock en planillas, leads en WhatsApp, ventas en papel. Todo desparramado, nada medible.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-gray-950 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            El problema
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-white sm:text-3xl">
            ¿Qué está frenando a tu concesionario?
          </h2>
        </FadeIn>

        <FadeIn stagger className="mt-12 grid gap-5 sm:grid-cols-3">
          {PROBLEMS.map(({ Icon, image, title, description }) => (
            <article
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900"
            >
              {/* Foto de fondo con overlay para legibilidad del texto */}
              <div className="relative aspect-[4/5]">
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/70 to-gray-950/10"
                />
              </div>

              {/* Contenido anclado abajo, sobre el gradiente */}
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/90 shadow-lg backdrop-blur-sm">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="mt-4 text-base font-medium text-white">{title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-gray-300">
                  {description}
                </p>
              </div>
            </article>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
