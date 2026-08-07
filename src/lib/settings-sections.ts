// Secciones de /dashboard/configuracion. La solapa activa viaja en `?tab=`, así
// que el valor de la URL SIEMPRE pasa por resolveSettingsSection() antes de
// usarse — mismo criterio que resolveSort() en lib/table/query-params.ts: el
// query string no se confía, se matchea contra esta whitelist.

export const SETTINGS_SECTIONS = [
  { value: "general", label: "General" },
  { value: "cotizacion", label: "Cotización" },
  { value: "usuarios", label: "Usuarios y accesos" },
  { value: "suscripcion", label: "Suscripción" },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["value"];

export const DEFAULT_SETTINGS_SECTION: SettingsSection = "general";

export function resolveSettingsSection(value: string | undefined | null): SettingsSection {
  const match = SETTINGS_SECTIONS.find((section) => section.value === value);
  return match?.value ?? DEFAULT_SETTINGS_SECTION;
}
