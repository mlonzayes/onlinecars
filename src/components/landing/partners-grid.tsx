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
    <div className="relative flex flex-col items-center gap-4 rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-white p-8 shadow-sm sm:flex-row sm:gap-8">
      <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-yellow-900 shadow">
        <Sparkles className="h-3 w-3" />
        Integración principal
      </span>
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm sm:h-24 sm:w-24">
        {partner.logoUrl ? (
          // Usamos <img> simple para que funcione con SVG inline o assets externos.
          // Si en el futuro reemplazamos por <Image>, hay que sumar el dominio a remotePatterns.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logoUrl} alt={partner.name} className="h-12 w-12 object-contain sm:h-14 sm:w-14" />
        ) : (
          <span className="text-2xl font-bold text-yellow-700">{partner.name[0]}</span>
        )}
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="text-2xl font-extrabold text-gray-900">{partner.name}</p>
        <p className="mt-2 text-sm text-gray-600">
          Sincronizá tu stock con MercadoLibre desde un solo lugar. Publicá una vez y aparecé en los dos.
        </p>
        {partner.comingSoon && (
          <span className="mt-3 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
            Próximamente
          </span>
        )}
      </div>
    </div>
  );
}

function SecondaryCard({ partner }: { partner: Partner }) {
  return (
    <div className="relative flex aspect-[3/2] flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm">
      {partner.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logoUrl} alt={partner.name} className="h-7 w-auto object-contain" />
      ) : (
        <span className="text-center text-sm font-bold tracking-tight text-gray-700">
          {partner.name}
        </span>
      )}
      {partner.comingSoon && (
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">
          Próximamente
        </span>
      )}
    </div>
  );
}
