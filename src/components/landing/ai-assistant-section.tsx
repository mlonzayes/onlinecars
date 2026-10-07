import { PiCheck, PiSparkle } from "react-icons/pi";

/**
 * "Gestioná tu concesionario desde Claude o ChatGPT" — el servidor MCP
 * (`/api/mcp`, rama feature/mcp-service-layer).
 *
 * El copy describe SOLO lo que hacen las tools reales (stock, gastos, margen,
 * leads, ventas, stock inmovilizado). Si se suma o se saca una tool, revisar
 * esto: prometer una acción que la IA después no puede hacer es peor que no
 * mencionarla.
 *
 * El chat es HTML/CSS, no una captura: pesa cero, se lee en mobile y no
 * envejece cuando cambia la UI de Claude o ChatGPT. Sin logos de terceros.
 */
const MESSAGES = [
  { from: "user", text: "Cargame un Corolla XEI 2021, 48.000 km, a USD 18.500" },
  {
    from: "ai",
    text: "Listo, lo cargué como borrador en tu stock. ¿Querés que lo publique en tu sitio?",
  },
  { from: "user", text: "Sí. Y sumale 150.000 de detailing al Amarok" },
  {
    from: "ai",
    text: "Publicado ✓ Gasto cargado al Amarok: con eso, tu margen real queda en USD 2.340.",
  },
] as const;

const POINTS = [
  "Cargá y publicá autos escribiendo como le hablás a un vendedor",
  "Imputá gastos y conocé la ganancia real de cada unidad",
  "Preguntá por leads, ventas o qué autos llevan más días sin moverse",
];

export function AiAssistantSection() {
  return (
    <section id="ia" className="bg-gray-950 px-4 py-16 sm:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="reveal-on-view">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-blue-400">
            <PiSparkle className="h-3.5 w-3.5" />
            Integración con IA
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-white sm:text-3xl">
            Gestioná tu concesionario desde Claude o ChatGPT
          </h2>
          <p className="mt-4 text-sm font-light leading-relaxed text-gray-300">
            Conectás tu cuenta de motorflow a la app de IA que ya usás y le pedís las cosas
            en tus palabras. Trabaja sobre tus datos, con tus permisos, y no publica nada sin
            que se lo pidas.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-2.5 text-sm font-light text-gray-200">
                <PiCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* Mock de conversación: es contenido (un ejemplo), no decoración. */}
        <figure className="reveal-on-view rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <figcaption className="sr-only">Ejemplo de conversación con el asistente</figcaption>
          <div className="flex flex-col gap-3">
            {MESSAGES.map((m) => (
              <p
                key={m.text}
                className={
                  m.from === "user"
                    ? "max-w-[85%] self-end rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white"
                    : "max-w-[85%] self-start rounded-2xl rounded-bl-md bg-white/10 px-4 py-2.5 text-sm font-light text-gray-100"
                }
              >
                {m.text}
              </p>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}
