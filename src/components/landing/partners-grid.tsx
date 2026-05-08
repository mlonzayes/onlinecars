import { Sparkles } from "lucide-react";

export interface Partner {
  name: string;
  /** SVG inline o ruta a un asset. Si no viene, se renderiza el name como texto */
  logoUrl?: string;
  /** Mostrar este partner en una card más grande con badge */
  primary?: boolean;
  /** Mostrar el badge de "Próximamente" */
  comingSoon?: boolean;
}

interface PartnersGridProps {
  partners: Partner[];
}

// Grid de partners/integraciones. La card "primary" ocupa más ancho y lleva
// un badge para destacarla. Cuando un partner aún no tiene logo SVG, se
// renderiza el nombre con un estilo de logo placeholder.
export function PartnersGrid({ partners }: PartnersGridProps) {
  const primary = partners.find((p) => p.primary);
  const rest = partners.filter((p) => !p.primary);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {primary && (
        <div className="lg:col-span-3">
          <PrimaryCard partner={primary} />
        </div>
      )}
      <div className="lg:col-span-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {rest.map((p) => (
          <SecondaryCard key={p.name} partner={p} />
        ))}
      </div>
    </div>
  );
}

function PrimaryCard({ partner }: { partner: Partner }) {
  return (
    <div className="relative flex flex-col items-center gap-3 rounded-xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white p-5 shadow-sm sm:flex-row sm:gap-5 sm:p-6">
      <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-900 shadow">
        <Sparkles className="h-3 w-3" />
        Integración principal
      </span>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm sm:h-16 sm:w-16">
        {partner.logoUrl ? (
          // Usamos <img> simple para que funcione con SVG inline o assets externos.
          // Si en el futuro reemplazamos por <Image>, hay que sumar el dominio a remotePatterns.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logoUrl} alt={partner.name} className="h-9 w-9 object-contain sm:h-11 sm:w-11" />
        ) : (
          <span className="text-xl font-bold text-yellow-700">{partner.name[0]}</span>
        )}
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-lg font-extrabold text-gray-900 sm:text-xl">{partner.name}</p>
        <p className="mt-1 text-xs text-gray-600 sm:text-sm">
          Sincronizá tu stock con MercadoLibre desde un solo lugar. Publicá una vez y aparecé en los dos.
        </p>
        {partner.comingSoon && (
          <span className="mt-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
            Próximamente
          </span>
        )}
      </div>
    </div>
  );
}

function SecondaryCard({ partner }: { partner: Partner }) {
  return (
    <div className="relative flex aspect-[3/2] flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm">
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logoUrl} alt={partner.name} className="h-6 w-auto object-contain" />
      ) : (
        <span className="text-center text-xs font-bold tracking-tight text-gray-700 sm:text-sm">
          {partner.name}
        </span>
      )}
      {partner.comingSoon && (
        <span className="text-[8px] font-bold uppercase tracking-wider text-amber-600">
          Próximamente
        </span>
      )}
    </div>
  );
}
