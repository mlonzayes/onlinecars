import { PiHandCoins, PiFlag, PiSquaresFour } from "react-icons/pi";
import { FadeIn } from "./fade-in";

/**
 * "Por qué motorflow" — fusión de BenefitsSection (5 items) y ServicesSection (7).
 *
 * Doce argumentos no se recuerdan; tres sí. Estos son los que responden las tres
 * objeciones reales del dealer: la económica (comisiones), la de identidad
 * (dependo de un portal) y la operativa (tengo todo desparramado).
 *
 * El roadmap que vivía en ServicesSection se movió a /precios: mezclar lo que
 * existe con lo que va a existir en la misma grilla hace que el que compra por
 * una feature futura se vaya cuando no la encuentra.
 */
const FEATURED = {
  Icon: PiHandCoins,
  title: "Sin comisiones por venta",
  description:
    "Pagás una suscripción mensual fija y listo. No importa si vendés tres autos o treinta: lo que facturás es 100% tuyo. En los portales, cada venta y cada contacto tienen un costo que te comen el margen.",
};

const OTHERS = [
  {
    Icon: PiFlag,
    title: "Tu marca, tu dominio",
    description:
      "Dejás de ser un perfil más adentro del portal de otro. Tu URL, tu logo, tus colores. Tus clientes te encuentran a vos en Google, no a la competencia que paga más publicidad.",
  },
  {
    Icon: PiSquaresFour,
    title: "Un solo panel para todo",
    description:
      "Stock, leads, clientes, ventas y documentación en el mismo lugar. Se terminaron las planillas sueltas, los datos en WhatsApp y los legajos en papel.",
  },
];

export function DifferentiatorsSection() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Por qué motorflow
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl">
            Tres razones, no doce
          </h2>
        </FadeIn>

        {/* Layout asimétrico: el argumento económico ocupa 2/3 porque es el más
            fuerte contra MercadoLibre. Los otros dos lo acompañan. */}
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <FadeIn className="lg:col-span-2">
            <article className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8">
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl transition-transform duration-700 group-hover:scale-150"
              />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <FEATURED.Icon className="h-6 w-6 text-white" />
              </div>
              <div className="relative mt-10">
                <h3 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
                  {FEATURED.title}
                </h3>
                <p className="mt-3 max-w-lg text-sm font-light leading-relaxed text-blue-50/90">
                  {FEATURED.description}
                </p>
              </div>
            </article>
          </FadeIn>

          {OTHERS.map(({ Icon, title, description }, i) => (
            <FadeIn key={title} className={i === 1 ? "lg:col-span-3" : undefined}>
              <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100/70">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="mt-5 text-lg font-medium tracking-tight text-gray-900">
                  {title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-gray-600">
                  {description}
                </p>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
