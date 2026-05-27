"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SectionType } from "@/lib/constants";
import type { SectionConfigByType } from "@/lib/sections/config-types";

// Render selectivo de controles de configuración por tipo de sección.
// Las opciones soportadas por backend vienen tipadas desde SectionConfigByType.

interface SectionConfigControlsProps<T extends SectionType> {
  type: T;
  config: SectionConfigByType[T];
  onConfigChange: (next: SectionConfigByType[T]) => void;
}

interface RadioOption<V extends string | number> {
  value: V;
  label: string;
  disabled?: boolean;
  disabledHint?: string;
}

function RadioGroup<V extends string | number>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: ReadonlyArray<RadioOption<V>>;
  onChange: (next: V) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => !opt.disabled && onChange(opt.value)}
          disabled={opt.disabled}
          title={opt.disabled ? opt.disabledHint : undefined}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-muted",
            opt.disabled && "cursor-not-allowed opacity-50 hover:bg-background"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SwitchRow({
  id,
  label,
  helperText,
  checked,
  disabled,
  disabledHint,
  onChange,
}: {
  id: string;
  label: string;
  helperText?: string;
  checked: boolean;
  disabled?: boolean;
  disabledHint?: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        {helperText && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {disabled && disabledHint && (
          <p className="text-xs text-muted-foreground italic">{disabledHint}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function SectionConfigControls<T extends SectionType>({
  type,
  config,
  onConfigChange,
}: SectionConfigControlsProps<T>) {
  // Helper to update a single field while preserving the rest.
  const update = <K extends keyof SectionConfigByType[T]>(
    key: K,
    value: SectionConfigByType[T][K]
  ) => {
    onConfigChange({ ...config, [key]: value });
  };

  if (type === "hero") {
    const c = config as SectionConfigByType["hero"];
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Opacidad del overlay ({c.overlay}%)</Label>
          <Slider
            min={0}
            max={100}
            value={[c.overlay]}
            onValueChange={(v) => {
              const next = Array.isArray(v) ? v[0] : v;
              update("overlay" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]]);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Alineación del contenido</Label>
          <RadioGroup
            value={c.align}
            options={[
              { value: "left", label: "Izquierda" },
              { value: "center", label: "Centro" },
            ]}
            onChange={(v) =>
              update("align" as keyof SectionConfigByType[T], v as SectionConfigByType[T][keyof SectionConfigByType[T]])
            }
          />
        </div>
        <SwitchRow
          id="hero-show-search"
          label="Mostrar buscador"
          helperText="Cuadro de búsqueda sobre la portada."
          checked={c.showSearch}
          onChange={(next) =>
            update("showSearch" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
        <SwitchRow
          id="hero-show-quick-actions"
          label="Mostrar tarjetas de acción rápida"
          helperText="3 tarjetas al pie (Catálogo, Vender mi auto, Contacto). Sugerencia: usá una u otra opción, no ambas, para no saturar el hero."
          checked={c.showQuickActions}
          onChange={(next) =>
            update("showQuickActions" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
      </div>
    );
  }

  if (type === "about") {
    const c = config as SectionConfigByType["about"];
    return (
      <div className="space-y-2">
        <Label>Disposición</Label>
        <RadioGroup
          value={c.layout}
          options={[
            { value: "text-only", label: "Solo texto" },
            { value: "image-left", label: "Imagen a la izquierda" },
            { value: "image-right", label: "Imagen a la derecha" },
          ]}
          onChange={(v) =>
            update("layout" as keyof SectionConfigByType[T], v as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
      </div>
    );
  }

  if (type === "catalog") {
    const c = config as SectionConfigByType["catalog"];
    return (
      <div className="space-y-4">
        <SwitchRow
          id="catalog-show-filters"
          label="Mostrar filtros"
          helperText="Permite filtrar el catálogo en el sitio público."
          checked={c.showFilters}
          onChange={(next) =>
            update("showFilters" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
        <div className="space-y-2">
          <Label htmlFor="catalog-page-size">Vehículos por página (6-18)</Label>
          <Input
            id="catalog-page-size"
            type="number"
            min={6}
            max={18}
            value={c.pageSize}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) {
                update(
                  "pageSize" as keyof SectionConfigByType[T],
                  n as SectionConfigByType[T][keyof SectionConfigByType[T]]
                );
              }
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Énfasis</Label>
          <RadioGroup
            value={c.emphasis}
            options={[
              { value: "featured", label: "Destacados primero" },
              { value: "recent", label: "Más recientes" },
            ]}
            onChange={(v) =>
              update("emphasis" as keyof SectionConfigByType[T], v as SectionConfigByType[T][keyof SectionConfigByType[T]])
            }
          />
        </div>
      </div>
    );
  }

  if (type === "gallery") {
    const c = config as SectionConfigByType["gallery"];
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Disposición</Label>
          <RadioGroup
            value={c.layout}
            options={[
              { value: "grid", label: "Grilla" },
              {
                value: "masonry",
                label: "Mosaico",
                disabled: true,
                disabledHint: "Próximamente",
              },
            ]}
            onChange={(v) =>
              update("layout" as keyof SectionConfigByType[T], v as SectionConfigByType[T][keyof SectionConfigByType[T]])
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Columnas</Label>
          <RadioGroup<number>
            value={c.columns}
            options={[
              { value: 2, label: "2" },
              { value: 3, label: "3" },
              { value: 4, label: "4" },
            ]}
            onChange={(v) =>
              update("columns" as keyof SectionConfigByType[T], v as SectionConfigByType[T][keyof SectionConfigByType[T]])
            }
          />
        </div>
      </div>
    );
  }

  if (type === "financing") {
    const c = config as SectionConfigByType["financing"];
    return (
      <SwitchRow
        id="financing-show-cta"
        label="Mostrar botón de cotización"
        helperText="Llamado a la acción para consultar planes."
        checked={c.showCalculatorCta}
        onChange={(next) =>
          update("showCalculatorCta" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
        }
      />
    );
  }

  if (type === "reviews") {
    const c = config as SectionConfigByType["reviews"];
    return (
      <div className="space-y-4">
        <SwitchRow
          id="reviews-show-cta"
          label="Mostrar botón para dejar opinión"
          checked={c.showCta}
          onChange={(next) =>
            update("showCta" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
        <div className="space-y-2">
          <Label htmlFor="reviews-max-items">Opiniones a mostrar (3-12)</Label>
          <Input
            id="reviews-max-items"
            type="number"
            min={3}
            max={12}
            value={c.maxItems}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              if (Number.isFinite(n)) {
                update(
                  "maxItems" as keyof SectionConfigByType[T],
                  n as SectionConfigByType[T][keyof SectionConfigByType[T]]
                );
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (type === "contact") {
    const c = config as SectionConfigByType["contact"];
    return (
      <div className="space-y-4">
        <SwitchRow
          id="contact-show-map"
          label="Mostrar mapa"
          checked={c.showMap}
          disabled
          disabledHint="Próximamente"
          onChange={(next) =>
            update("showMap" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
        <SwitchRow
          id="contact-show-whatsapp"
          label="Mostrar botón de WhatsApp"
          checked={c.showWhatsapp}
          onChange={(next) =>
            update("showWhatsapp" as keyof SectionConfigByType[T], next as SectionConfigByType[T][keyof SectionConfigByType[T]])
          }
        />
      </div>
    );
  }

  return null;
}
