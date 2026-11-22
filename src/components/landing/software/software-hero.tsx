import Image from "next/image";
import Link from "next/link";
import { getPrimaryCta } from "@/lib/seo";
import { SOFTWARE_SUMMARY } from "@/data/software-page";
import { PrimaryCta } from "../primary-cta";

/**
 * Hero de /software-para-concesionarias. El H1 es la frase que se busca: acá
 * llega gente que NO conoce la marca, así que primero se dice qué es.
 * El CTA va arriba (antes del detalle) y sale de getPrimaryCta().
 */
export function SoftwareHero() {
  const cta = getPrimaryCta();

  return (
    <section className="bg-paper px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-6">
          <nav aria-label="Ruta" className="text-sm text-ink-soft">
            <Link href="/" className="hover:text-ink">Inicio</Link>
            <span className="mx-2 text-ink/30">/</span>
            <span>Software para concesionarias</span>
          </nav>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-light leading-[1.05] tracking-tight text-ink text-balance">
            Software de gestión para concesionarias y agencias de autos
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            motorflow junta en un panel el stock, las consultas, los clientes, las ventas y la web
            de tu agencia. Funciona en el navegador y también lo manejás escribiéndole al asistente
            con IA.
          </p>

          <ul className="mt-6 space-y-2 text-base text-ink">
            {SOFTWARE_SUMMARY.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryCta href={cta.href} size="lg" className="w-full sm:w-auto">
              {cta.label}
            </PrimaryCta>
            <Link href="/precios" className="text-center text-sm text-brand underline-offset-4 hover:underline">
              Ver precios y planes
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="overflow-hidden rounded-xl border border-ink/10 shadow-xl shadow-ink/5">
            <Image
              src="/mockups/ventas.png"
              alt="Panel de motorflow con el listado de consultas y ventas de una concesionaria"
              width={1344}
              height={590}
              sizes="(max-width: 1024px) 100vw, 560px"
              quality={90}
              priority
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
