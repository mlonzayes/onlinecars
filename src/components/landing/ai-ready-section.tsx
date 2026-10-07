import { PiFileText, PiBracketsCurly, PiShieldCheck } from "react-icons/pi";
import { FadeIn } from "./fade-in";
import { AiChatMock } from "./ai-chat-mock";

/**
 * "Preparado para la IA" — compatibilidad con ChatGPT, Claude y otros asistentes.
 *
 * Cada punto describe algo que el producto YA hace, no una promesa:
 *  - llms.txt por tenant (`tenant/[slug]/llms.txt`) con datos y stock con precios.
 *  - JSON-LD AutoDealer + Car/Offer en la home y la ficha de cada vehículo.
 *  - robots.txt que deja entrar a los buscadores de IA y bloquea a los crawlers
 *    de entrenamiento (`AI_TRAINING_CRAWLERS` en lib/seo.ts).
 * Si alguno de esos cambia, este copy tiene que cambiar con él.
 */
const POINTS = [
  {
    Icon: PiFileText,
    title: "Tu stock en un formato que la IA lee",
    description:
      "Tu sitio publica un resumen de la concesionaria y de cada auto, con precio, pensado para que lo lean los modelos de IA.",
  },
  {
    Icon: PiBracketsCurly,
    title: "Cada auto, con sus datos ordenados",
    description:
      "Marca, modelo, año, kilometraje y precio en el estándar schema.org: el mismo que usan Google y los asistentes para entender una publicación.",
  },
  {
    Icon: PiShieldCheck,
    title: "Visible para buscar, cerrado para entrenar",
    description:
      "Los buscadores de IA que citan la fuente pueden leer tu sitio. Los bots que solo juntan datos para entrenar modelos quedan afuera.",
  },
];

const ASSISTANTS = ["ChatGPT", "Claude", "Perplexity"];

export function AiReadySection() {
  return (
    <section id="ia" className="relative overflow-hidden bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
              Preparado para la IA
            </p>
            <h2 className="mt-3 text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl">
              Tus autos, a la vista de ChatGPT y Claude
            </h2>
            <p className="mt-4 max-w-xl text-sm font-light leading-relaxed text-gray-600 sm:text-base">
              Cada vez más compradores le preguntan a un asistente de IA antes
              de buscar en Google. Tu sitio está preparado para que esos
              asistentes encuentren tu stock y te citen en la respuesta.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Asistentes compatibles">
              {ASSISTANTS.map((name) => (
                <li
                  key={name}
                  className="rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {name}
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn stagger className="mt-10 space-y-6">
            {POINTS.map(({ Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70">
                  <Icon aria-hidden className="h-5 w-5 text-blue-600" />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 sm:text-base">{title}</h3>
                  <p className="mt-1 text-sm font-light leading-relaxed text-gray-600">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </FadeIn>
        </div>

        {/* Desplazado hacia abajo en desktop: rompe la grilla centrada y lee
            como "la respuesta" a lo que plantea la columna de texto. */}
        <FadeIn className="lg:translate-y-8">
          <AiChatMock />
        </FadeIn>
      </div>
    </section>
  );
}
