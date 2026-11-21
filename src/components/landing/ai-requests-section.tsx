import { PiCarProfile, PiChartLineUp, PiReceipt } from "react-icons/pi";
import { Badge } from "@/components/ui/badge";
import { getPrimaryCta } from "@/lib/seo";
import { ChatBubble } from "./chat-bubble";
import { GlassBackdrop } from "./glass-backdrop";
import { PrimaryCta } from "./primary-cta";
import { SectionHeading } from "./section-heading";

/**
 * La prueba del diferencial: tres pedidos que el Asistente del panel (y el MCP,
 * que comparte las tools) resuelve hoy: crear vehículo, cargar gasto, margen de
 * una venta. Si se suma un ejemplo, que sea una tool que exista en
 * src/lib/mcp/tools/: prometer un pedido que la IA no puede cumplir es lo
 * primero que el dealer va a probar.
 */
const REQUESTS = [
  {
    tag: "Cargar",
    Icon: PiCarProfile,
    ask: "cargame la Hilux SRV 2021, 45 mil km, a 32.000 dólares",
    result: "Confirmás y queda como borrador.",
  },
  {
    tag: "Gastos",
    Icon: PiReceipt,
    ask: "cargale 150.000 de detailing al Corolla",
    result: "Recalcula el margen del auto.",
  },
  {
    tag: "Números",
    Icon: PiChartLineUp,
    ask: "¿cuánto le gané al Gol Trend?",
    result: "Venta, costo y gastos.",
  },
];

export function AiRequestsSection() {
  const cta = getPrimaryCta();

  return (
    <section id="pedidos" className="relative isolate scroll-mt-20 overflow-hidden bg-paper-deep px-4 py-16 sm:px-6 sm:py-24">
      <GlassBackdrop />
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Pedíselo como a un empleado" />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {REQUESTS.map(({ tag, Icon, ask, result }, i) => (
            <article
              key={tag}
              className="glass-card sd-rise flex flex-col rounded-2xl p-5 sm:p-6"
              // Escalonado: cada tarjeta termina de entrar un poco después
              style={{ animationRange: `entry ${i * 8}% cover ${28 + i * 8}%` }}
            >
              <Badge variant="secondary" className="h-6 gap-1.5 bg-brand/10 px-2.5 font-normal text-brand">
                <Icon aria-hidden />
                {tag}
              </Badge>
              <ChatBubble from="user" className="mt-5 max-w-[95%] text-sm">
                {ask}
              </ChatBubble>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{result}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-ink-soft">También funciona desde Claude o ChatGPT.</p>
          <PrimaryCta href={cta.href} className="w-full sm:w-auto">
            {cta.shortLabel}
          </PrimaryCta>
        </div>
      </div>
    </section>
  );
}
