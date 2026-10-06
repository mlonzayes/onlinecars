import { Cog, Fuel, Gauge } from "lucide-react";

// Íconos que se repiten en CADA card de vehículo. Inline, cada lucide son ~6
// nodos SVG; con 30 cards en el home eran ~500 nodos para hidratar. Con el
// sprite se dibujan una vez y cada card los referencia con <use> (2 nodos).
export const VEHICLE_ICON_IDS = {
  gauge: "vi-gauge",
  fuel: "vi-fuel",
  cog: "vi-cog",
} as const;

export type VehicleIconName = keyof typeof VEHICLE_ICON_IDS;

/**
 * Definiciones del sprite. Se monta UNA vez en <TenantChrome>. Oculto con
 * tamaño 0 y no con display:none, que en algunos browsers rompe <use>.
 */
export function VehicleIconSprite() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute h-0 w-0 overflow-hidden">
      <symbol id={VEHICLE_ICON_IDS.gauge} viewBox="0 0 24 24">
        <Gauge />
      </symbol>
      <symbol id={VEHICLE_ICON_IDS.fuel} viewBox="0 0 24 24">
        <Fuel />
      </symbol>
      <symbol id={VEHICLE_ICON_IDS.cog} viewBox="0 0 24 24">
        <Cog />
      </symbol>
    </svg>
  );
}
