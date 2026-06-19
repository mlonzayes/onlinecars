import { Mail, MessageCircle, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AccountRowActions } from "@/components/admin/account-row-actions";
import type { PlatformAccount } from "@/lib/admin-stats";

interface AccountsTableProps {
  accounts: PlatformAccount[];
  emptyLabel?: string;
}

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Activa",
  expired: "Vencida",
  suspended: "Suspendida",
};

const STATUS_CLASS: Record<string, string> = {
  trial: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-200 text-gray-700",
  suspended: "bg-red-100 text-red-800",
};

// Badge de días de trial: rojo si es urgente (≤3), ámbar (≤7), normal si falta más.
function trialDaysClass(days: number): string {
  if (days <= 3) return "bg-red-100 text-red-800";
  if (days <= 7) return "bg-amber-100 text-amber-800";
  return "bg-muted text-foreground";
}

function waLink(whatsapp: string): string {
  return `https://wa.me/${whatsapp.replace(/\D/g, "")}`;
}

export function AccountsTable({ accounts, emptyLabel }: AccountsTableProps) {
  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        {emptyLabel ?? "No hay cuentas."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cuenta</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Trial</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead className="text-right">Ventas</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Clientes</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <p className="font-medium leading-tight">{a.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{a.slug}</p>
              </TableCell>
              <TableCell className="capitalize">{a.plan}</TableCell>
              <TableCell>
                <Badge className={cn("text-xs", STATUS_CLASS[a.subscriptionStatus])}>
                  {STATUS_LABELS[a.subscriptionStatus] ?? a.subscriptionStatus}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {a.trialDaysLeft !== null ? (
                  <Badge className={cn("text-xs tabular-nums", trialDaysClass(a.trialDaysLeft))}>
                    {a.trialDaysLeft <= 0 ? "vencido" : `${a.trialDaysLeft} d`}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{a.counts.vehicles}</TableCell>
              <TableCell className="text-right tabular-nums">{a.counts.sales}</TableCell>
              <TableCell className="text-right tabular-nums">{a.counts.leads}</TableCell>
              <TableCell className="text-right tabular-nums">{a.counts.customers}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {a.email && (
                    <a href={`mailto:${a.email}`} title={a.email} className="hover:text-foreground">
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {a.phone && (
                    <a href={`tel:${a.phone}`} title={a.phone} className="hover:text-foreground">
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {a.whatsapp && (
                    <a
                      href={waLink(a.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={a.whatsapp}
                      className="hover:text-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                  {!a.email && !a.phone && !a.whatsapp && (
                    <span className="text-xs">sin datos</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <AccountRowActions
                  id={a.id}
                  name={a.name}
                  plan={a.plan}
                  subscriptionStatus={a.subscriptionStatus}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
