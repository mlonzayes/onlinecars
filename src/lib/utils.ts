import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency: string = "ARS"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "-";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Días transcurridos desde una fecha hasta hoy. Usado para el "aging" del stock
// (cuántos días lleva un vehículo en el inventario). Devuelve 0 si la fecha es futura.
export function getDaysInStock(from: Date | string): number {
  const start = typeof from === "string" ? new Date(from) : from;
  const ms = Date.now() - start.getTime();
  if (Number.isNaN(ms) || ms < 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // eliminar acentos
    .replace(/[^a-z0-9\s-]/g, "")   // solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, "-")            // espacios a guiones
    .replace(/-+/g, "-")             // guiones múltiples a uno solo
    .slice(0, 50);                   // máximo 50 caracteres
}
