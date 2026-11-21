import { cn } from "@/lib/utils";

interface IphoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Carcasa de iPhone en CSS puro (sin imagen): marco de titanio, Dynamic Island,
 * barra de estado, botones laterales e indicador de inicio. Server Component y
 * sin bytes de imagen, así no pesa en el LCP del hero.
 *
 * Medidas FIJAS con las proporciones del iPhone 15 Pro (71,6 × 146,6 mm →
 * 300 × 614 px). No usa aspect-ratio: con `min-width: auto`, el ancho mínimo
 * del contenido (las burbujas del chat) le gana al ratio y el teléfono quedaba
 * petiso y ancho. Para achicarlo se escala ENTERO con `zoom` (`.iphone-zoom` en
 * globals.css), así el contenido mantiene la proporción de un teléfono real.
 */
export function IphoneFrame({ children, className }: IphoneFrameProps) {
  return (
    <div
      className={cn(
        "iphone-frame relative h-[614px] w-[300px] shrink-0 rounded-[52px] p-[9px]",
        className
      )}
    >
      {/* Botones: acción + volumen a la izquierda, encendido a la derecha */}
      <span aria-hidden className="iphone-btn -left-[3px] top-[18%] h-[5%]" />
      <span aria-hidden className="iphone-btn -left-[3px] top-[27%] h-[9%]" />
      <span aria-hidden className="iphone-btn -left-[3px] top-[38%] h-[9%]" />
      <span aria-hidden className="iphone-btn -right-[3px] top-[30%] h-[13%]" />

      <div className="relative h-full w-full rounded-[44px] bg-black p-[3px]">
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[41px] bg-white">
          <StatusBar />
          {children}
          <span
            aria-hidden
            className="absolute bottom-2 left-1/2 h-[5px] w-[36%] -translate-x-1/2 rounded-full bg-ink/85"
          />
          {/* Reflejo del vidrio */}
          <span aria-hidden className="iphone-glare pointer-events-none absolute inset-0" />
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-12 shrink-0 items-center justify-between px-7 pt-1 text-[13px] font-semibold text-ink">
      <span className="w-12 tabular-nums">9:41</span>
      <span aria-hidden className="absolute left-1/2 top-2.5 h-[26px] w-[34%] -translate-x-1/2 rounded-full bg-black" />
      <span aria-hidden className="flex w-12 items-center justify-end gap-1">
        <svg viewBox="0 0 18 12" className="h-[10px] w-[15px]" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[10px] w-[13px]" fill="currentColor">
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.8 6.8 0 0 0 8 4a6.8 6.8 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c-.4 0-.8.2-1.1.4L8 11.6l1.1-1.8c-.3-.2-.7-.4-1.1-.4Z" />
        </svg>
        <svg viewBox="0 0 27 12" className="h-[11px] w-[24px]">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" fill="none" stroke="currentColor" strokeOpacity="0.4" />
          <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
          <path d="M24.5 4v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}
