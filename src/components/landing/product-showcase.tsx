import Image from "next/image";
import { FadeIn } from "./fade-in";

// Screenshots reales del producto. Todas ~1344x590 (panorámicas).
const SCREENS = [
  {
    src: "/mockups/vehiculos.png",
    label: "Vehículos",
    title: "Tu stock, siempre al día",
    desc: "Cargá, publicá y actualizá tus vehículos en minutos. Precio, fotos y estado en tiempo real.",
  },
  {
    src: "/mockups/ventas.png",
    label: "Ventas",
    title: "Cerrá operaciones sin papeles",
    desc: "Seguí cada venta con su legajo digital: documentos, estados y fechas en un solo lugar.",
  },
  {
    src: "/mockups/clientes.png",
    label: "Clientes",
    title: "Conocé a tus clientes",
    desc: "Tu base de clientes ordenada y a mano, lista para hacer seguimiento y volver a vender.",
  },
  {
    src: "/mockups/cotizaciones.png",
    label: "Cotizaciones",
    title: "Presupuestos al instante",
    desc: "Generá cotizaciones profesionales en PDF y enviáselas al cliente en el momento.",
  },
  {
    src: "/mockups/portales.png",
    label: "Portales",
    title: "Publicá en MercadoLibre con un click",
    desc: "Sincronizá tu stock con los portales sin cargar todo dos veces.",
  },
  {
    src: "/mockups/web_2.png",
    label: "Tu sitio público",
    title: "Tu marca, online",
    desc: "El catálogo que ven tus clientes, con tu logo, tus colores y tu dominio.",
  },
];

export function ProductShowcase() {
  return (
    <section className="bg-gray-50 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-600">
            El producto
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-gray-900 sm:text-3xl">
            Mirá el panel por dentro
          </h2>
          <p className="mt-3 text-sm font-light leading-relaxed text-gray-600">
            Todo lo que necesitás para gestionar tu concesionario, en un solo lugar.
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
                <h3 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-gray-600">
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
