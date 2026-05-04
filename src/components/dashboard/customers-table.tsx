"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Customer } from "@prisma/client";

interface CustomersTableProps {
  customers: Customer[];
}

const TOAST_DURATION = 2000;

export function CustomersTable({ customers }: CustomersTableProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que querés eliminar este cliente?")) return;
    setLoading(id, true);
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al eliminar el cliente", {
          duration: TOAST_DURATION,
        });
        return;
      }
      toast.success("Cliente eliminado", { duration: TOAST_DURATION });
      router.refresh();
    } finally {
      setLoading(id, false);
    }
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">No tenés clientes cargados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Agregá tu primer cliente para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => {
            const displayName =
              customer.type === "company"
                ? customer.businessName ?? customer.firstName
                : [customer.firstName, customer.lastName].filter(Boolean).join(" ");

            return (
              <TableRow key={customer.id}>
                <TableCell>
                  <p className="font-medium leading-tight">{displayName}</p>
                  {customer.type === "company" && (
                    <p className="text-xs text-muted-foreground">
                      Contacto: {[customer.firstName, customer.lastName].filter(Boolean).join(" ")}
                    </p>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm">
                    {customer.documentType} {customer.documentNumber}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      customer.type === "individual"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                    )}
                  >
                    {customer.type === "individual" ? "Particular" : "Empresa"}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="text-sm">
                    {customer.email && (
                      <p className="truncate max-w-[220px]">{customer.email}</p>
                    )}
                    {customer.phone && (
                      <p className="text-xs text-muted-foreground">{customer.phone}</p>
                    )}
                    {!customer.email && !customer.phone && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-muted outline-none disabled:opacity-50"
                      disabled={loadingIds.has(customer.id)}
                    >
                      {loadingIds.has(customer.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                      <span className="sr-only">Acciones</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={<Link href={`/dashboard/clientes/${customer.id}`} />}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
