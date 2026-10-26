import { PiCarProfile, PiChartLineUp, PiReceipt } from "react-icons/pi";
import { Badge } from "@/components/ui/badge";
import { getPrimaryCta } from "@/lib/seo";
import { ChatBubble } from "./chat-bubble";
import { FadeIn } from "./fade-in";
import { PrimaryCta } from "./primary-cta";
import { SectionHeading } from "./section-heading";

/**
 * La prueba del diferencial: tres pedidos que el MCP resuelve hoy (crear
 * vehículo, cargar gasto, margen de una venta). Si se suma un ejemplo, que sea
 * una tool que exista en src/lib/mcp/tools/: prometer un pedido que la IA no
 * puede cumplir es lo primero que el dealer va a probar.
 */
const REQUESTS = [
  {
    tag: "Cargar",
    Icon: PiCarProfile,
    ask: "cargame la Hilux SRV 2021, 45 mil km, a 32.000 dólares",
    result: "Queda como borrador hasta que digas «publicalo».",
  },
  {
    tag: "Gastos",
    Icon: PiReceipt,
    ask: "cargale 150.000 de detailing al Corolla",
    result: "Se suma al costo del auto y recalcula el margen.",
  },
  {
    tag: "Números",
    Icon: PiChartLineUp,
    ask: "¿cuánto le gané al Gol Trend?",
    result: "Venta, costo y gastos, en la moneda de la venta.",
  },
];

export function AiRequestsSection() {
  const cta = getPrimaryCta();

  return (
    <section id="pedidos" className="scroll-mt-20 bg-paper-deep px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Pedíselo como a un empleado" subtitle="Desde el celular, sobre tu stock real." />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {REQUESTS.map(({ tag, Icon, ask, result }) => (
            <FadeIn key={tag} className="flex flex-col rounded-2xl border border-ink/5 bg-white p-5 sm:p-6">
              <Badge variant="secondary" className="h-6 gap-1.5 bg-brand/10 px-2.5 font-normal text-brand">
                <Icon aria-hidden />
                {tag}
              </Badge>
              <ChatBubble from="user" className="mt-5 max-w-[95%] text-sm">
                {ask}
              </ChatBubble>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">{result}</p>
            </FadeIn>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-ink-soft">¿Sin IA? Todo se hace también desde el panel.</p>
          <PrimaryCta href={cta.href} className="w-full sm:w-auto">
            {cta.shortLabel}
          </PrimaryCta>
        </div>
      </div>
    </section>
  );
}
