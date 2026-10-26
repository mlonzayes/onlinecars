import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { IconType } from "react-icons";
import { SiClaude, SiMeta, SiOpenai, SiWhatsapp } from "react-icons/si";
import { PiChartBar, PiCurrencyDollar, PiMicrosoftExcelLogo, PiPlus } from "react-icons/pi";
import { FadeIn } from "./fade-in";
import { SectionHeading } from "./section-heading";

/**
 * Integraciones. SOLO las que existen en el código: si se suma una que "viene
 * pronto", el dealer que la busca se registra, no la encuentra y se va.
 *   IA (MCP): src/lib/mcp · ML: src/lib/mercadolibre · Meta: src/lib/meta ·
 *   Clarity: src/lib/clarity · Excel: src/lib/import · Dólar: lib/exchange-rate
 *
 * Logos en monocromo (gris → color de marca al hover): mantienen la paleta de
 * la página y se usan solo para indicar compatibilidad.
 */
interface Integration {
  name: string;
  desc: string;
  plan?: string;
  Icon?: IconType;
  logo?: string;
}

const INTEGRATIONS: Integration[] = [
  { name: "ChatGPT", Icon: SiOpenai, desc: "Cargá y consultá por chat." },
  { name: "Claude", Icon: SiClaude, desc: "Cargá y consultá por chat." },
  { name: "Mercado Libre", logo: "/logo/meli.png", desc: "Stock sincronizado.", plan: "Media" },
  { name: "WhatsApp", Icon: SiWhatsapp, desc: "Botón en tu web.", plan: "Media" },
  { name: "Meta Ads", Icon: SiMeta, desc: "Pixel y API de conversiones.", plan: "Media" },
  { name: "Microsoft Clarity", Icon: PiChartBar, desc: "Mapas de calor de tu web.", plan: "Media" },
  { name: "Excel", Icon: PiMicrosoftExcelLogo, desc: "Importá tu stock." },
  { name: "Dólar oficial", Icon: PiCurrencyDollar, desc: "Cotización oficial BCRA." },
];

export function IntegrationsSection() {
  return (
    <section id="integraciones" className="scroll-mt-20 bg-paper px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title="Se conecta con lo que ya usás" />

        <FadeIn className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {INTEGRATIONS.map(({ name, desc, plan, Icon, logo }) => (
            <article key={name} className="group flex flex-col rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-brand/30 sm:p-6">
              <div className="flex items-center justify-between">
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={28}
                    height={28}
                    className="size-7 object-contain grayscale transition group-hover:grayscale-0"
                  />
                ) : (
                  Icon && <Icon className="size-7 text-ink/60 transition group-hover:text-brand" aria-hidden />
                )}
                {plan && (
                  <Badge variant="outline" className="border-ink/10 font-normal text-ink-soft">
                    Plan {plan}
                  </Badge>
                )}
              </div>
              <h3 className="mt-4 font-display text-base font-normal text-ink sm:text-lg">{name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft sm:text-sm">{desc}</p>
            </article>
          ))}
        </FadeIn>

        <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
          <PiPlus className="size-4 text-brand" aria-hidden />
          ¿Usás otra? Contanos y la evaluamos.
        </p>
      </div>
    </section>
  );
}
