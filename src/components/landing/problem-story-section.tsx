import { FadeIn } from "./fade-in";
import { SectionHeading } from "./section-heading";

/**
 * Problema, en frases cortas y con detalles del rubro. La tira de canales
 * muestra el síntoma: el mismo auto con estados distintos en cada lado.
 * Es la sección de tensión, por eso no lleva CTA.
 */
const CHANNELS = [
  { name: "MercadoLibre", status: "Activa", stale: true },
  { name: "Instagram", status: "Disponible", stale: true },
  { name: "Planilla", status: "Vendido", stale: false },
];

const PAINS = [
  "Lo vendiste el sábado y el lunes te siguen preguntando.",
  "Los gastos, en un papelito. El margen, a ojo.",
  "Te buscan en Google y aparece la de enfrente.",
];

export function ProblemStorySection() {
  return (
    <section className="bg-navy px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeading tone="dark" title="El mismo auto, cargado en tres lados" />
          <FadeIn>
            <ul className="mt-8 max-w-sm divide-y divide-white/10 border-y border-white/10">
              {CHANNELS.map((c) => (
                <li key={c.name} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-white/70">Corolla 2019 · {c.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs text-white ${c.stale ? "bg-white/10" : "bg-brand"}`}
                  >
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>

        <FadeIn stagger className="flex flex-col justify-center gap-5 lg:gap-7">
          {PAINS.map((p) => (
            <p key={p} className="font-display text-xl font-light leading-snug text-white/85 sm:text-2xl">
              {p}
            </p>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
