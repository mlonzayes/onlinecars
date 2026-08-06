import { ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SiteRowActions } from "@/components/admin/site-row-actions";
import { getTenantPublicUrl } from "@/lib/tenant";
import { resolveTemplate } from "@/lib/tenant-templates";
import type { PlatformAccount } from "@/lib/admin-stats";

interface SitesTableProps {
  accounts: PlatformAccount[];
  emptyLabel?: string;
}

// Un sitio está online solo si se cumplen las DOS condiciones que chequea
// getDealershipBySlug. Separamos el motivo para que el estado explique el 404
// en vez de decir "pausado" cuando en realidad la cuenta está dada de baja.
function siteState(account: PlatformAccount): {
  label: string;
  className: string;
  live: boolean;
} {
  if (!account.active) {
    return { label: "Cuenta de baja", className: "bg-gray-200 text-gray-700", live: false };
  }
  if (!account.siteEnabled) {
    return { label: "Pausado", className: "bg-amber-100 text-amber-800", live: false };
  }
  return { label: "Online", className: "bg-green-100 text-green-800", live: true };
}

export function SitesTable({ accounts, emptyLabel }: SitesTableProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        {emptyLabel ?? "No hay sitios."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concesionario</TableHead>
            <TableHead>Estado del sitio</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Plantilla</TableHead>
            {/* Stock total cargado, no publicados: _count.vehicles no filtra
                por publishedAt. Alcanza como señal de "tiene contenido". */}
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => {
            const state = siteState(a);
            // Absoluta: usa el dominio propio si lo cargó, si no el subdominio.
            const publicUrl = getTenantPublicUrl(a);
            const template = resolveTemplate(a.templateId);

            return (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-medium leading-tight">{a.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{a.slug}</p>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${state.className}`}>{state.label}</Badge>
                </TableCell>
                <TableCell>
                  {state.live ? (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      {publicUrl.replace(/^https:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span
                      className="text-xs text-muted-foreground"
                      title="El sitio no responde hasta que esté online"
                    >
                      {publicUrl.replace(/^https:\/\//, "")}
                    </span>
                  )}
                  {a.website && (
                    <p className="text-[10px] text-muted-foreground">dominio propio</p>
                  )}
                </TableCell>
                <TableCell className="text-xs">{template.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {a.counts.vehicles}
                </TableCell>
                <TableCell className="text-xs capitalize">{a.plan}</TableCell>
                <TableCell>
                  <SiteRowActions
                    id={a.id}
                    name={a.name}
                    siteEnabled={a.siteEnabled}
                    templateId={a.templateId}
                    accountActive={a.active}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
