import { SOFTWARE_MODULE_GROUPS } from "@/data/software-page";

/**
 * Qué trae el sistema, agrupado por tema. Cada grupo es un H2 propio porque
 * cada uno responde a otra búsqueda ("control de stock de autos", "CRM para
 * concesionarias", "página web para agencia de autos").
 * Layout asimétrico: el título a la izquierda, los módulos a la derecha.
 */
export function SoftwareModules() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl space-y-14 sm:space-y-20">
        {SOFTWARE_MODULE_GROUPS.map((group) => (
          <div key={group.id} id={group.id} className="grid scroll-mt-24 gap-6 lg:grid-cols-12 lg:gap-12">
            <h2 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-light leading-[1.1] tracking-tight text-ink text-balance lg:col-span-4">
              {group.heading}
            </h2>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              {group.modules.map((m) => (
                <div key={m.title} className="border-t border-ink/10 pt-5">
                  <h3 className="text-lg font-normal text-ink">{m.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-ink-soft">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
