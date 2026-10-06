import { VEHICLE_ICON_IDS, type VehicleIconName } from "./vehicle-icon-sprite";

interface VehicleIconProps {
  name: VehicleIconName;
  className?: string;
}

// Referencia a un ícono del sprite (ver VehicleIconSprite). Requiere que el
// sprite esté montado en la página: lo hace <TenantChrome>.
export function VehicleIcon({ name, className }: VehicleIconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <use href={`#${VEHICLE_ICON_IDS[name]}`} />
    </svg>
  );
}
