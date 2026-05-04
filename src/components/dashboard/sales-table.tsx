"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  MoreHorizontal,
  Eye,
  Trash2,
  ShoppingCart,
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
import { cn, formatCurrency } from "@/lib/utils";

export interface SaleRow {
  id: string;
  status: string;
  salePrice: string;
  currency: string;
  createdAt: string;
  customer: {
    id: string;
    type: string;
    firstName: string;
    lastName: string | null;
    businessName: string | null;
    documentType: string;
    documentNumber: string;
  };
  vehicle: {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: number;
  };
}

interface SalesTableProps {
  sales: SaleRow[];
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  reserved: "Reservado",
  in_progress: "En curso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  reserved: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const TOAST_DURATION = 2000;

export function SalesTable({ sales }: SalesTableProps) {
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
    if (!confirm("¿Seguro que querés eliminar esta venta? Solo se pueden eliminar borradores.")) return;
    setLoading(id, true);
    try {
      const res = await fetch(`/api/ventas/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Error al eliminar la venta", { duration: TOAST_DURATION });
        return;
      }
      toast.success("Venta eliminada", { duration: TOAST_DURATION });
      router.refresh();
    } finally {
      setLoading(id, false);
    }
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">No tenés ventas registradas</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Creá tu primera venta para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const customerName =
              sale.customer.type === "company"
                ? sale.customer.businessName ?? sale.customer.firstName
                : [sale.customer.firstName, sale.customer.lastName]
                    .filter(Boolean)
                    .join(" ");

            return (
              <TableRow key={sale.id}>
                {/* Vehículo */}
                <TableCell>
                  <p className="font-medium leading-tight">{sale.vehicle.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.vehicle.brand} {sale.vehicle.model} · {sale.vehicle.year}
                  </p>
                </TableCell>

                {/* Cliente */}
                <TableCell>
                  <p className="font-medium leading-tight">{customerName}</p>
                  <p className="text-xs text-muted-foreground">
                    {sale.customer.documentType} {sale.customer.documentNumber}
                  </p>
                </TableCell>

                {/* Precio */}
                <TableCell className="font-medium">
                  {formatCurrency(sale.salePrice, sale.currency)}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Badge className={cn("text-xs", STATUS_STYLES[sale.status] ?? "")}>
                    {STATUS_LABELS[sale.status] ?? sale.status}
                  </Badge>
                </TableCell>

                {/* Fecha */}
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(sale.createdAt).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-muted outline-none disabled:opacity-50"
                      disabled={loadingIds.has(sale.id)}
                    >
                      {loadingIds.has(sale.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                      <span className="sr-only">Acciones</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={<Link href={`/dashboard/ventas/${sale.id}`} />}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      {sale.status === "draft" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDelete(sale.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
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
