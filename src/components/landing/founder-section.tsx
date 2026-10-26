import { PiCheck } from "react-icons/pi";
import { FadeIn } from "./fade-in";

/**
 * Quién está detrás. Mientras no haya clientes con testimonio, la prueba social
 * honesta es una persona con nombre y apellido que atiende.
 *
 * PENDIENTE (Mateo): foto real en `public/team/mateo.jpg` (reemplaza el
 * monograma) y validar la frase. Nada inventado.
 */
const GUARANTEES = ["Sin permanencia", "Tus datos son tuyos", "Atención por WhatsApp"];

export function FounderSection() {
  return (
    <section className="bg-paper-deep px-4 py-16 sm:px-6 sm:py-24">
      <FadeIn className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span
          aria-hidden
          className="flex size-16 items-center justify-center rounded-full border border-ink/10 bg-white font-display text-xl font-light text-ink"
        >
          ML
        </span>
        <blockquote className="mt-6 font-display text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-snug text-ink text-balance">
          «Cuando creás tu cuenta, el onboarding lo hacemos juntos.»
        </blockquote>
        <p className="mt-4 text-sm text-ink-soft">
          <span className="text-ink">Mateo Lonzayes</span> · creador de motorflow
        </p>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ink-soft">
          {GUARANTEES.map((g) => (
            <li key={g} className="inline-flex items-center gap-1.5">
              <PiCheck className="size-4 text-brand" aria-hidden />
              {g}
            </li>
          ))}
        </ul>
      </FadeIn>
    </section>
  );
}
