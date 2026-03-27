"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Car, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
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
}

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservado",
  sold: "Vendido",
};

export function VehicleTable({ vehicles }: VehicleTableProps) {
  const router = useRouter();

  async function handlePublishToggle(id: string, isPublished: boolean) {
    await fetch(`/api/vehiculos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishedAt: isPublished ? null : new Date().toISOString() }),
    });
    router.refresh();
  }

  async function handleFeaturedToggle(id: string, featured: boolean) {
    await fetch(`/api/vehiculos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !featured }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que querés eliminar este vehículo?")) return;
    await fetch(`/api/vehiculos/${id}`, { method: "DELETE" });
    router.refresh();
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableRow key={vehicle.id}>
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
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/vehiculos/${vehicle.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePublishToggle(vehicle.id, isPublished)}
                      >
                        {isPublished ? "Despublicar" : "Publicar"}
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
  );
}
