import { PiCaretDown } from "react-icons/pi";

export interface FaqItemProps {
  question: string;
  answer: React.ReactNode;
  /** Si arranca abierto. Default: false */
  defaultOpen?: boolean;
}

/**
 * Pregunta frecuente con `<details>` nativo: abre y cierra sin JS, es accesible
 * de fábrica (teclado + lectores de pantalla) y la respuesta queda en el HTML
 * aunque esté cerrada, que es lo que lee Google. Server Component.
 */
export function FaqItem({ question, answer, defaultOpen = false }: FaqItemProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-gray-200 bg-white transition-colors hover:border-gray-300 open:border-blue-200 open:shadow-sm open:shadow-blue-100/50"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50/80 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold text-gray-900 sm:text-base">{question}</span>
        {/* La curva con overshoot imita el "back" que tenía con GSAP. */}
        <PiCaretDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-open:rotate-180 group-open:text-blue-600 motion-reduce:transition-none" />
      </summary>
      <div className="px-4 pb-4 text-xs leading-relaxed text-gray-600 sm:text-sm">{answer}</div>
    </details>
  );
}
