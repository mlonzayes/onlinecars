import Image from "next/image";
import { PiCheck } from "react-icons/pi";
import { FadeIn } from "./fade-in";

/**
 * "Producto en acción" — absorbe a la vieja SolutionSection.
 *
 * Antes había DOS secciones: una con 5 bullets abstractos (Solución) y otra con
 * 6 screenshots (Showcase). El screenshot ES el argumento: mostrar la pantalla
 * convence en 2 segundos lo que una lista de features no logra en 30.
 *
 * De 6 pantallas quedan 4 — las que responden una objeción de compra concreta.
 * Clientes y Cotizaciones se fueron a /precios: son buenas features, pero no
 * son las que deciden el alta.
 */
const SCREENS = [
  {
    src: "/mockups/web_2.png",
    label: "Tu sitio público",
    title: "Tu marca, online",
    // Objeción: "¿cómo se ve MI sitio?" — es lo primero que quieren ver.
    desc: "El catálogo que ven tus clientes, con tu logo, tus colores y tu dominio propio.",
    points: ["Dominio propio", "Tu branding", "Catálogo en tiempo real"],
  },
  {
    src: "/mockups/vehiculos.png",
    label: "Vehículos",
    title: "Tu stock, siempre al día",
    // Objeción: "¿cargar el stock me va a llevar horas?"
    desc: "Cargá, publicá y actualizá tus vehículos en minutos. Precio, fotos y estado en tiempo real.",
    points: ["Alta en minutos", "Carga masiva desde Excel", "Fotos ordenadas"],
  },
  {
    src: "/mockups/portales.png",
    label: "Portales",
    title: "Seguí en MercadoLibre, sin cargar dos veces",
    // Objeción #1 del rubro: "¿tengo que abandonar MercadoLibre?"
    desc: "Conectás tu cuenta y tu stock queda sincronizado. Publicás una vez y aparecés en los dos lados.",
    points: ["Sincronización automática", "Una sola carga", "Sin perder tu reputación"],
  },
  {
    src: "/mockups/ventas.png",
    label: "Leads y ventas",
    title: "Del primer contacto al legajo, sin papeles",
    // Objeción: "¿esto es una web linda o gestiona de verdad?"
    desc: "Las consultas entran a tu panel y las seguís hasta el cierre, con el legajo digital de cada operación.",
    points: ["Leads y clientes", "Legajo digital", "Documentos seguros"],
  },
];

export function ProductShowcase() {
  return (
    <section id="producto" className="bg-gray-50 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            El producto
          </p>
          <h2 className="mt-3 text-2xl font-normal tracking-tight text-gray-900 sm:text-3xl">
            Mirá el panel por dentro
          </h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-gray-600">
            No te contamos lo que hace. Te lo mostramos.
          </p>
        </div>

        {/* Filas alternadas: imagen grande + texto, intercalando el lado. */}
        <div className="mt-14 space-y-14 sm:space-y-20">
          {SCREENS.map((s, i) => (
            <FadeIn
              key={s.label}
              className={`flex flex-col items-center gap-8 lg:gap-14 ${
                i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
              }`}
            >
              <div className="w-full lg:w-3/5">
                <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl shadow-gray-200/60">
                  <Image
                    src={s.src}
                    alt={`${s.label} en motorflow`}
                    width={1344}
                    height={590}
                    sizes="(max-width: 1024px) 100vw, 600px"
                    quality={90}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="w-full lg:w-2/5">
                <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
                  {s.label}
                </p>
                <h3 className="mt-2 text-xl font-medium tracking-tight text-gray-900 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-gray-600">
                  {s.desc}
                </p>
                <ul className="mt-5 flex flex-col gap-2">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2 text-sm font-light text-gray-700"
                    >
                      <PiCheck className="h-4 w-4 shrink-0 text-blue-600" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
