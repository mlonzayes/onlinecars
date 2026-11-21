import { GlassBackdrop } from "./glass-backdrop";
import { SectionHeading } from "./section-heading";

/**
 * Cómo arrancás. Baja el miedo a "usar IA": el asistente ya viene adentro del
 * panel, no hay nada que instalar ni conectar.
 *
 * Banda oscura a propósito: viene pegada a Precios (blanca) y con el mismo
 * fondo las dos se leían como una sola sección. Las cards son compactas y SIN
 * backdrop-filter: dentro de la lista animada (sd-rise) el blur dejaba cortes
 * verticales raros sobre las manchas del fondo.
 */
const STEPS = [
  { n: "01", title: "Creás tu cuenta" },
  { n: "02", title: "Le escribís al asistente" },
  { n: "03", title: "Cargás tus autos" },
];

export function OnboardingStepsSection() {
  return (
    <section className="relative isolate overflow-hidden bg-navy px-4 py-16 text-white sm:px-6 sm:py-24">
      <GlassBackdrop variant="night" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading tone="dark" title="Cargá tu stock con el asistente" />

        {/* La animación va en la lista entera (no por card): así las tres
            entran juntas y quedan siempre en la misma línea. */}
        <ol className="sd-rise mt-10 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[#aebcff]/30 bg-[#aebcff]/10 font-display text-base text-[#aebcff]">
                {s.n}
              </span>
              <h3 className="font-display text-base font-normal sm:text-lg">{s.title}</h3>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
