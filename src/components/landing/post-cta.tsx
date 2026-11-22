import { getPrimaryCta } from "@/lib/seo";
import { PrimaryCta } from "./primary-cta";

interface PostCtaProps {
  /** "inline": franja corta en medio de la nota. "box": cierre al final. */
  variant: "inline" | "box";
}

/**
 * CTA de las notas del blog. El destino sale SIEMPRE de getPrimaryCta(), que
 * decide según NEXT_PUBLIC_ENABLE_LOGIN (registro o formulario de contacto).
 */
export function PostCta({ variant }: PostCtaProps) {
  const cta = getPrimaryCta();

  if (variant === "inline") {
    return (
      <div className="my-10 flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          motorflow te arma la web con tu catálogo y te deja cargar autos escribiéndole al asistente.
        </p>
        <PrimaryCta href={cta.href} className="w-full shrink-0 sm:w-auto">
          {cta.shortLabel}
        </PrimaryCta>
      </div>
    );
  }

  return (
    <div className="mt-12 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center sm:p-8">
      <h2 className="text-lg font-semibold text-gray-900">Probá motorflow con tu stock</h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-light text-gray-600">
        Tu web con catálogo, el stock y las consultas en un panel, y un asistente con IA para cargar
        autos escribiendo. Sin comisión por venta.
      </p>
      <PrimaryCta href={cta.href} className="mt-5">
        {cta.label}
      </PrimaryCta>
    </div>
  );
}
