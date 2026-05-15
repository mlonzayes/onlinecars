import Image from "next/image";
import type { IconType } from "react-icons";
import { PiCheckCircle, PiClock } from "react-icons/pi";

export interface Integration {
  title: string;
  description: string;
  icon: IconType;
  /** Estado de la integración. */
  status: "available" | "coming-soon";
  /** Logo del partner (ruta a /public/logos/...). Si se pasa, reemplaza al icono. */
  logo?: string;
  /** Override del fondo del box del logo/icono (ej: "bg-[#FFE600]" para
   *  matchear color de marca). Si no se pasa, usa azul por default cuando es
   *  icono, o blanco con ring cuando es logo. */
  iconBg?: string;
}

interface PartnersGridProps {
  integrations: Integration[];
}

export function PartnersGrid({ integrations }: PartnersGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {integrations.map((integration) => (
        <IntegrationCard key={integration.title} integration={integration} />
      ))}
    </div>
  );
}

function IntegrationCard({ integration }: { integration: Integration }) {
  const isAvailable = integration.status === "available";
  const Icon = integration.icon;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 sm:p-8">
      {/* Header: logo o icono + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl shadow-md transition-transform group-hover:scale-110 sm:h-16 sm:w-16 ${
            integration.iconBg
              ? `${integration.iconBg} text-white`
              : integration.logo
                ? "bg-white ring-1 ring-gray-200"
                : "bg-blue-600 text-white shadow-blue-600/30"
          }`}
        >
          {integration.logo ? (
            <Image
              src={integration.logo}
              alt={integration.title}
              fill
              sizes="64px"
              className="object-contain p-2"
            />
          ) : (
            <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
          )}
        </div>

        {/* Badges neutros: azul subtle para disponible, gris para próximamente.
            Sin colores semánticos verde/ámbar. */}
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
            isAvailable
              ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
              : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
          }`}
        >
          {isAvailable ? (
            <>
              <PiCheckCircle className="h-3 w-3" /> Disponible
            </>
          ) : (
            <>
              <PiClock className="h-3 w-3" /> Próximamente
            </>
          )}
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {integration.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
          {integration.description}
        </p>
      </div>
    </div>
  );
}
