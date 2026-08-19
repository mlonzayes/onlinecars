import { PiLockOpen, PiDownloadSimple, PiLightning, PiChatCircleDots } from "react-icons/pi";
import { FadeIn } from "./fade-in";

/**
 * Banda de garantías — REEMPLAZA a TestimonialsSection.
 *
 * Los testimonios que había eran ficticios ("Automotores del Parque, Rosario",
 * "Norte Autos, Córdoba"...). En un rubro chico y federal como el de los
 * concesionarios, el visitante googlea esos nombres: si no existen, perdés el
 * lead ahí mismo y no vuelve. Prueba social inventada es peor que ninguna.
 *
 * Esto es prueba honesta: cada línea es verificable y todas quitan riesgo, que
 * es justo lo que hay que hacer un scroll ANTES de mostrar el precio.
 *
 * Cuando tengas 2-3 clientes reales con permiso ESCRITO, esta sección se
 * reemplaza por sus testimonios (con nombre y concesionario completos). Uno
 * real vale más que seis genéricos.
 */
const GUARANTEES = [
  {
    Icon: PiLockOpen,
    title: "Sin permanencia",
    description: "Cancelás cuando quieras, sin penalidad ni letra chica.",
  },
  {
    Icon: PiDownloadSimple,
    title: "Tus datos son tuyos",
    description: "Exportás tu stock y tus clientes en cualquier momento.",
  },
  {
    Icon: PiLightning,
    title: "Alta el mismo día",
    description: "Creás la cuenta, cargás tu stock y tu sitio queda online.",
  },
  {
    Icon: PiChatCircleDots,
    title: "Soporte de verdad",
    description: "Hablás con una persona por WhatsApp, no con un ticket.",
  },
];

export function GuaranteesSection() {
  return (
    <section className="bg-blue-50/60 px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {GUARANTEES.map(({ Icon, title, description }) => (
            <FadeIn key={title} className="flex flex-col">
              <Icon className="h-6 w-6 text-blue-600" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm font-light leading-relaxed text-gray-600">
                {description}
              </p>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
