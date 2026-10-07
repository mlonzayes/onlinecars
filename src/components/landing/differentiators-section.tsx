import {
  PiHandCoins,
  PiFlag,
  PiSquaresFour,
  PiLockOpen,
  PiDownloadSimple,
  PiLightning,
  PiChatCircleDots,
} from "react-icons/pi";

/**
 * "Por qué motorflow" — tres razones + las garantías, en UNA sección.
 *
 * Las razones responden las tres objeciones reales del dealer: la económica
 * (comisiones), la de identidad (dependo de un portal) y la operativa (tengo
 * todo desparramado). Las garantías quitan riesgo justo antes del precio; antes
 * eran una banda aparte y sumaban un corte más al scroll.
 *
 * Las garantías reemplazan a los testimonios, que eran ficticios: en un rubro
 * chico el visitante googlea el concesionario y si no existe perdés el lead.
 * Cuando haya 2-3 clientes reales con permiso ESCRITO, van acá.
 *
 * Server Component puro: el revelado al scrollear es CSS (`.reveal-on-view`).
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
      "Dejás de ser un perfil más adentro del portal de otro. Tu URL, tu logo, tus colores. Tus clientes te encuentran a vos en Google.",
  },
  {
    Icon: PiSquaresFour,
    title: "Un solo panel para todo",
    description:
      "Stock, leads, clientes, ventas y documentación en el mismo lugar. Se terminaron las planillas sueltas y los legajos en papel.",
  },
];

const GUARANTEES = [
  { Icon: PiLockOpen, title: "Sin permanencia", description: "Cancelás cuando quieras, sin letra chica." },
  { Icon: PiDownloadSimple, title: "Tus datos son tuyos", description: "Exportás stock y clientes cuando quieras." },
  { Icon: PiLightning, title: "Alta el mismo día", description: "Cargás tu stock y tu sitio queda online." },
  { Icon: PiChatCircleDots, title: "Soporte de verdad", description: "Una persona por WhatsApp, no un ticket." },
];

export function DifferentiatorsSection() {
  return (
    <section className="bg-white px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="reveal-on-view max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            Por qué motorflow
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl">
            Tres razones, no doce
          </h2>
        </div>

        {/* Layout asimétrico: el argumento económico ocupa 2/3 porque es el más
            fuerte contra MercadoLibre. Los otros dos lo acompañan. */}
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <article className="reveal-on-view flex flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <FEATURED.Icon className="h-6 w-6 text-white" />
            </div>
            <div className="mt-10">
              <h3 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
                {FEATURED.title}
              </h3>
              <p className="mt-3 max-w-lg text-sm font-light leading-relaxed text-blue-50/90">
                {FEATURED.description}
              </p>
            </div>
          </article>

          {OTHERS.map(({ Icon, title, description }, i) => (
            <article
              key={title}
              className={`reveal-on-view flex flex-col rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/50 p-7 ${
                i === 1 ? "lg:col-span-3" : ""
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100/70">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mt-5 text-lg font-medium tracking-tight text-gray-900">{title}</h3>
              <p className="mt-2 max-w-2xl text-sm font-light leading-relaxed text-gray-600">
                {description}
              </p>
            </article>
          ))}
        </div>

        {/* Garantías: quitan riesgo un scroll antes del precio. */}
        <ul className="reveal-on-view mt-12 grid gap-6 border-t border-gray-100 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map(({ Icon, title, description }) => (
            <li key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">{title}</h3>
                <p className="mt-1 text-sm font-light leading-relaxed text-gray-600">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
