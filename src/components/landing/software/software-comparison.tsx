import { SOFTWARE_COMPARISON } from "@/data/software-page";

/**
 * "Planilla o sistema": la comparación que hace el dueño antes de cambiar.
 * Tabla real (no cards) para que Google y los motores de IA la lean como tal.
 * En mobile se desplaza en horizontal dentro de su caja, no la página.
 */
export function SoftwareComparison() {
  return (
    <section className="bg-paper px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-2xl font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-light leading-[1.1] tracking-tight text-ink text-balance">
          Planilla de Excel o sistema de gestión
        </h2>
        <p className="mt-4 max-w-2xl text-base text-ink-soft sm:text-lg">
          Si hoy llevás el stock en una planilla, esto es lo que cambia cuando el stock y las
          ventas pasan a un sistema.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/10 text-ink">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium">Tema</th>
                <th scope="col" className="px-5 py-4 font-medium">Con una planilla</th>
                <th scope="col" className="px-5 py-4 font-medium text-brand">Con motorflow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {SOFTWARE_COMPARISON.map((row) => (
                <tr key={row.topic}>
                  <th scope="row" className="px-5 py-4 font-normal text-ink">{row.topic}</th>
                  <td className="px-5 py-4 text-ink-soft">{row.spreadsheet}</td>
                  <td className="px-5 py-4 text-ink">{row.motorflow}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
