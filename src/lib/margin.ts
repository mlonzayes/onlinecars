// Cálculo del margen de un vehículo: precio de venta - costo de compra - gastos.
// El costo y los gastos pueden estar en otra moneda que el precio (típico: compra
// USD, venta ARS), así que se normalizan a la moneda de venta usando la cotización.

export interface MarginResult {
  amount: number; // margen en la moneda de venta
  pct: number; // porcentaje sobre el precio de venta
  currency: string; // moneda de venta
}

export interface MoneyAmount {
  amount: number;
  currency: string;
}

interface MarginInput {
  price: number;
  currency: string;
  costPrice: number | null;
  costCurrency: string | null;
  // Cotización efectiva del dealer (oficial + spread), en ARS por USD. null si
  // no hay dato — en ese caso no se puede convertir entre monedas distintas.
  usdToArsRate: number | null;
  // Gastos de reacondicionamiento, cada uno con su moneda.
  expenses?: MoneyAmount[];
}

// Convierte un monto de una moneda a otra usando la cotización USD/ARS.
// Devuelve null si no se puede (sin cotización para un par distinto, o par no soportado).
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  usdToArsRate: number | null,
): number | null {
  if (from === to) return amount;
  if (!usdToArsRate || usdToArsRate <= 0) return null;
  if (from === "USD" && to === "ARS") return amount * usdToArsRate;
  if (from === "ARS" && to === "USD") return amount / usdToArsRate;
  return null; // par no soportado
}

// Devuelve el margen, o null si no se puede calcular (sin costo cargado, sin
// cotización para convertir, o par de monedas no soportado).
export function computeVehicleMargin({
  price,
  currency,
  costPrice,
  costCurrency,
  usdToArsRate,
  expenses = [],
}: MarginInput): MarginResult | null {
  if (costPrice === null || costPrice <= 0 || price <= 0) return null;

  const costInSaleCurrency = convertAmount(
    costPrice,
    costCurrency ?? currency,
    currency,
    usdToArsRate,
  );
  if (costInSaleCurrency === null) return null;

  let expensesInSaleCurrency = 0;
  for (const e of expenses) {
    const v = convertAmount(e.amount, e.currency, currency, usdToArsRate);
    if (v === null) return null; // no podemos calcular con precisión
    expensesInSaleCurrency += v;
  }

  const amount = price - costInSaleCurrency - expensesInSaleCurrency;
  return { amount, pct: (amount / price) * 100, currency };
}
