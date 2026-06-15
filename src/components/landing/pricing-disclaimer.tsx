/**
 * Aclaración legal/comercial de precios. Se usa bajo las dos superficies de
 * pricing (landing y /precios) para mantener el mismo mensaje en un solo lugar.
 */
export function PricingDisclaimer() {
  return (
    <p className="mx-auto max-w-2xl text-center text-xs font-light leading-relaxed text-gray-500">
      Los precios mostrados incluyen <strong className="font-medium text-gray-600">50% OFF</strong>{" "}
      válido los <strong className="font-medium text-gray-600">primeros 6 meses</strong> desde el
      alta. Cumplido ese período, se factura el valor de lista vigente al momento. Los planes se
      ajustan por inflación de forma aproximada cada 6 meses. Precios en pesos argentinos, IVA no
      incluido.
    </p>
  );
}
