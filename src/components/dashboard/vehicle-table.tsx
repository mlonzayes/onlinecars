"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Car, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Star, Trash2, ShoppingBag, Lock } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { VehicleImage } from "@prisma/client";
import type { PlanLimits } from "@/lib/plans";
import { Checkbox } from "@/components/ui/checkbox";

// Versión serializada: price como string, fechas como string
export interface SerializedVehicleRow {
  id: string;
  dealershipId: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price: string;
  currency: string;
  kilometers: number | null;
  fuelType: string | null;
  transmission: string | null;
  color: string | null;
  doors: number | null;
  engine: string | null;
  description: string | null;
  condition: string;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  images: VehicleImage[];
}

interface VehicleTableProps {
  vehicles: SerializedVehicleRow[];
  limits: PlanLimits;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

const TOAST_DURATION = 2000;

export function VehicleTable({ vehicles, limits }: VehicleTableProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isAllSelected = selectedIds.size > 0 && selectedIds.size === vehicles.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < vehicles.length;

  function setLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev);
      loading ? next.add(id) : next.delete(id);
      return next;
    });
  }

  async function handlePublishToggle(id: string, isPublished: boolean) {
    setLoading(id, true);
    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishedAt: isPublished ? null : new Date().toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast.success(isPublished ? "Vehículo despublicado" : "Vehículo publicado", { duration: TOAST_DURATION });
      router.refresh();
    } catch {
      toast.error("Error al cambiar la publicación", { duration: TOAST_DURATION });
    } finally {
      setLoading(id, false);
    }
  }

  async function handleFeaturedToggle(id: string, featured: boolean) {
    setLoading(id, true);
    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !featured }),
      });
      if (!res.ok) throw new Error();
      toast.success(featured ? "Destaque removido" : "Vehículo destacado", { duration: TOAST_DURATION });
      router.refresh();
    } catch {
      toast.error("Error al cambiar el destaque", { duration: TOAST_DURATION });
    } finally {
      setLoading(id, false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que querés eliminar este vehículo?")) return;
    setLoading(id, true);
    try {
      const res = await fetch(`/api/vehiculos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Vehículo eliminado", { duration: TOAST_DURATION });
      router.refresh();
    } catch {
      toast.error("Error al eliminar el vehículo", { duration: TOAST_DURATION });
    } finally {
      setLoading(id, false);
    }
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Car className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-muted-foreground">No tenés vehículos cargados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Agregá tu primer vehículo para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedIds.size} seleccionados</span>
          <Button variant="destructive" size="sm" onClick={() => {
            if (!confirm("¿Eliminar vehículos seleccionados?")) return;
            // Acá iría la llamada a la API bulk (implementación backend pendiente)
            toast.error("Funcionalidad bulk en desarrollo.");
          }}>
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar seleccionados
          </Button>
        </div>
      )}
      
      <div className="rounded-lg border">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] px-4">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isSomeSelected}
                onCheckedChange={(checked) => {
                  if (!limits.allowBulkActions) {
                    return toast("Mejorá tu plan", { description: "Las acciones masivas están disponibles a partir del plan Media." });
                  }
                  if (checked) {
                    setSelectedIds(new Set(vehicles.map((v) => v.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead className="w-[56px]" />
            <TableHead>Vehículo</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Publicación</TableHead>
            <TableHead className="w-[40px]">Dest.</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((vehicle) => {
            const primaryImage = vehicle.images[0];
            const isPublished = vehicle.publishedAt !== null;

            return (
              <TableRow key={vehicle.id} className={selectedIds.has(vehicle.id) ? "bg-muted/50" : ""}>
                {/* Checkbox */}
                <TableCell className="px-4">
                  <Checkbox 
                    checked={selectedIds.has(vehicle.id)}
                    onCheckedChange={(checked) => {
                      if (!limits.allowBulkActions) {
                        return toast("Mejorá tu plan", { description: "Las acciones masivas están disponibles a partir del plan Media." });
                      }
                      const next = new Set(selectedIds);
                      if (checked) next.add(vehicle.id);
                      else next.delete(vehicle.id);
                      setSelectedIds(next);
                    }}
                  />
                </TableCell>
                
                {/* Imagen */}
                <TableCell>
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt ?? vehicle.title}
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Car className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>

                {/* Título */}
                <TableCell>
                  <p className="font-medium leading-tight">{vehicle.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                </TableCell>

                {/* Precio */}
                <TableCell className="font-medium">
                  {formatCurrency(vehicle.price, vehicle.currency)}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      vehicle.status === "available" &&
                        "bg-green-100 text-green-800 hover:bg-green-100",
                      vehicle.status === "reserved" &&
                        "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
                      vehicle.status === "sold" && "bg-red-100 text-red-800 hover:bg-red-100",
                    )}
                  >
                    {STATUS_LABELS[vehicle.status] ?? vehicle.status}
                  </Badge>
                </TableCell>

                {/* Publicado */}
                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs",
                      isPublished
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-100",
                    )}
                  >
                    {isPublished ? "Publicado" : "Borrador"}
                  </Badge>
                </TableCell>

                {/* Destacado */}
                <TableCell>
                  <Star
                    className={cn(
                      "h-4 w-4",
                      vehicle.featured
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground",
                    )}
                  />
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-muted outline-none disabled:opacity-50"
                      disabled={loadingIds.has(vehicle.id)}
                    >
                      {loadingIds.has(vehicle.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                      <span className="sr-only">Acciones</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={<Link href={`/dashboard/vehiculos/${vehicle.id}`} />}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePublishToggle(vehicle.id, isPublished)}
                      >
                        {isPublished ? (
                          <><EyeOff className="mr-2 h-4 w-4" /> Despublicar</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" /> Publicar en Web</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!limits.allowMLIntegration) {
                            return toast("Mejorá tu plan", { description: "Publicar en Mercado Libre requiere el plan Media o Premium." });
                          }
                          // Optimistic update redirect
                          router.push(`/dashboard/vehiculos/${vehicle.id}#ml`);
                        }}
                      >
                        {limits.allowMLIntegration ? (
                          <ShoppingBag className="mr-2 h-4 w-4" />
                        ) : (
                          <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        Publicar en ML
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleFeaturedToggle(vehicle.id, vehicle.featured)}
                      >
                        <Star className="mr-2 h-4 w-4" />
                        {vehicle.featured ? "Quitar destaque" : "Destacar"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDelete(vehicle.id)}
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
    </div>
  );
}
