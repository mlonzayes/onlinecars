import { AlertCircle, PackageOpen, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ML_LISTING_TYPE_LABELS } from "@/lib/mercadolibre/listing-types";
import type { MLPackSummary, MLPacksOverview } from "@/lib/mercadolibre/packs";

const PACK_KIND_LABEL: Record<MLPackSummary["kind"], string> = {
  publications: "Publicación",
  upgrades: "Destaques",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("es-AR");
}

function PackCard({ pack }: { pack: MLPackSummary }) {
  const usedPct = pack.total > 0 ? Math.min(100, (pack.used / pack.total) * 100) : 0;
  const expires = formatDate(pack.expiresAt);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{pack.name}</CardTitle>
          <Badge variant={pack.kind === "upgrades" ? "default" : "secondary"}>
            {PACK_KIND_LABEL[pack.kind]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>
          <span className="text-3xl font-bold tabular-nums">{pack.remaining}</span>
          <span className="ml-1 text-sm text-muted-foreground">
            {pack.remaining === 1 ? "lugar libre" : "lugares libres"} de {pack.total}
          </span>
        </p>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={pack.total}
          aria-valuenow={pack.used}
          aria-label={`${pack.used} de ${pack.total} lugares usados`}
        >
          <div className="h-full bg-[#3483FA]" style={{ width: `${usedPct}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {pack.listingTypes.length > 0 && (
            <span>{pack.listingTypes.map((t) => ML_LISTING_TYPE_LABELS[t] ?? t).join(" · ")}</span>
          )}
          {expires && <span>Vence {expires}</span>}
          {pack.autoRenew && (
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Se renueva solo
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Notice({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

interface MLPacksSummaryProps {
  overview: MLPacksOverview | null;
}

/** Paquetes activos del dealer en ML con el cupo que le queda en cada uno. */
export function MLPacksSummary({ overview }: MLPacksSummaryProps) {
  if (!overview) {
    return (
      <Notice
        icon={AlertCircle}
        title="No pudimos consultar tus paquetes"
        text="Mercado Libre no respondió. Podés publicar igual; recargá la página en un rato para ver el cupo."
      />
    );
  }

  if (overview.packs.length === 0) {
    return (
      <Notice
        icon={PackageOpen}
        title="No tenés paquetes activos"
        text="Los paquetes se contratan con tu ejecutivo de Mercado Libre. Sin paquete, cada vehículo que publiques queda pendiente de pago."
      />
    );
  }

  return (
    <section aria-label="Paquetes de Mercado Libre" className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Paquetes activos</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overview.packs.map((pack) => (
          <PackCard key={pack.id} pack={pack} />
        ))}
      </div>
    </section>
  );
}
