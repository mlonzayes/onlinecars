import { PiStorefront, PiGlobe, PiListDashes } from "react-icons/pi";
import { FadeIn } from "./fade-in";

const PROBLEMS = [
  {
    Icon: PiStorefront,
    title: "Todo pasa por MercadoLibre",
    description:
      "Dependés de un portal que cambia tarifas y reglas cuando quiere. Si mañana te conviene menos, no tenés alternativa propia.",
  },
  {
    Icon: PiGlobe,
    title: "Sin identidad digital propia",
    description:
      "Tus clientes te buscan en Google y no te encuentran. Tu marca no existe fuera de los portales de terceros.",
  },
  {
    Icon: PiListDashes,
    title: "El caos operativo",
    description:
      "Stock en planillas, leads en WhatsApp, ventas en papel. Todo desparramado, nada medible.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-blue-50 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            El problema
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
            ¿Qué está frenando a tu concesionario?
          </h2>
        </FadeIn>

        <FadeIn stagger className="mt-12 grid gap-5 sm:grid-cols-3">
          {PROBLEMS.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-blue-100 bg-white p-6 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-gray-500">
                {description}
              </p>
            </div>
          ))}
        </FadeIn>
      </div>
    </section>
  );
}
