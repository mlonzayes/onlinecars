import { prisma } from "./prisma";

// Estados de venta que bloquean modificaciones al vehículo asociado.
// Si una venta está en draft o cancelled, el vehículo se puede editar libremente.
export const BLOCKING_SALE_STATUSES = [
  "reserved",
  "in_progress",
  "completed",
] as const;

export type BlockingSaleStatus = (typeof BLOCKING_SALE_STATUSES)[number];

const BLOCKING_SALE_LABELS: Record<BlockingSaleStatus, string> = {
  reserved: "Reservada",
  in_progress: "En curso",
  completed: "Completada",
};

export interface BlockingSale {
  id: string;
  status: BlockingSaleStatus;
}

// Devuelve la venta activa que bloquea ediciones sobre el vehículo, o null si no hay.
// Solo busca dentro del dealership para preservar el aislamiento multi-tenant.
export async function findBlockingSale(
  vehicleId: string,
  dealershipId: string
): Promise<BlockingSale | null> {
  const sale = await prisma.sale.findFirst({
    where: {
      vehicleId,
      dealershipId,
      status: { in: [...BLOCKING_SALE_STATUSES] },
      // Las ventas de stock ilimitado (0km) NO bloquean la edición del vehículo:
      // la publicación se sigue administrando aunque tenga ventas en curso.
      unlimitedStock: false,
    },
    select: { id: true, status: true },
  });

  if (!sale) return null;
  return sale as BlockingSale;
}

export function blockingSaleErrorBody(sale: BlockingSale) {
  return {
    error: `No se puede modificar el vehículo: tiene una venta ${BLOCKING_SALE_LABELS[sale.status]}.`,
    blockingSale: sale,
  };
}
