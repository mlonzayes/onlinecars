import Image from "next/image";
import { FadeIn } from "./fade-in";
import { SectionHeading } from "./section-heading";

/**
 * "Detrás de la IA hay un sistema": responde "¿es un chatbot o un sistema de
 * verdad?" con capturas reales del producto.
 *
 * PENDIENTE: captura real del sitio PÚBLICO de un tenant (hoy se muestra la
 * config del panel). No usar website_mockup_*.png: es una imagen generada.
 * El dominio propio NO está disponible (CUSTOM_DOMAINS_ENABLED = false): no
 * prometerlo hasta que lo esté.
 */
const SCREENS = [
  { src: "/mockups/web.png", title: "Tu web, con tu marca", desc: "Logo, color y catálogo siempre al día." },
  { src: "/mockups/portales.png", title: "Mercado Libre sincronizado", desc: "Publicás una vez, aparecés en los dos." },
  { src: "/mockups/ventas.png", title: "Consultas al panel", desc: "Cada una llega con el auto que miraron." },
];

export function SystemShowcaseSection() {
  const [main, ...side] = SCREENS;

  return (
    <section id="producto" className="scroll-mt-20 bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Detrás, un sistema completo" subtitle="Stock, consultas, ventas y gastos por auto." />

        <FadeIn className="mt-10 grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="overflow-hidden rounded-xl border border-ink/10 shadow-xl shadow-ink/5 lg:col-span-8">
            <Image src={main.src} alt="Panel de motorflow: configuración del sitio web" width={1344} height={590} sizes="(max-width: 1024px) 100vw, 760px" quality={90} className="w-full" />
          </div>
          <div className="lg:col-span-4">
            <h3 className="font-display text-2xl font-light text-ink">{main.title}</h3>
            <p className="mt-2 text-base text-ink-soft">{main.desc}</p>
          </div>
        </FadeIn>

        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-8">
          {side.map((s) => (
            <FadeIn key={s.title}>
              <div className="overflow-hidden rounded-xl border border-ink/10 shadow-xl shadow-ink/5">
                <Image src={s.src} alt={`${s.title} en el panel de motorflow`} width={1344} height={590} sizes="(max-width: 768px) 100vw, 560px" quality={90} className="w-full" />
              </div>
              <h3 className="mt-5 font-display text-xl font-light text-ink">{s.title}</h3>
              <p className="mt-1 text-base text-ink-soft">{s.desc}</p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
