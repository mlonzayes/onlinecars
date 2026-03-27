import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
