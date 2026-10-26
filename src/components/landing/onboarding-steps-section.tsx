import { FadeIn } from "./fade-in";
import { SectionHeading } from "./section-heading";

/**
 * Cómo arrancás. Baja el miedo a "conectar una IA": ese paso lo hacemos
 * nosotros en el onboarding.
 */
const STEPS = [
  { n: "1", title: "Creás tu cuenta", desc: "Tu web online en el día." },
  { n: "2", title: "Conectamos tu IA", desc: "Lo hacemos con vos." },
  { n: "3", title: "Cargás tus autos", desc: "Por chat, panel o Excel." },
];

export function OnboardingStepsSection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Arrancás hoy. La IA te la conectamos nosotros" />

        <ol className="relative mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {/* Línea que une los pasos (solo cuando están en fila). */}
          <span aria-hidden className="absolute left-6 right-6 top-6 hidden border-t border-dashed border-ink/15 sm:block" />
          {STEPS.map((s) => (
            <li key={s.n} className="relative flex items-start gap-4 sm:flex-col sm:gap-0">
              <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-white font-display text-xl font-light text-brand">
                {s.n}
              </span>
              <FadeIn className="sm:mt-5">
                <h3 className="font-display text-lg font-normal text-ink sm:text-xl">{s.title}</h3>
                <p className="mt-1 text-base text-ink-soft">{s.desc}</p>
              </FadeIn>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
