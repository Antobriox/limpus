import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind CSS de forma segura
 * Combina clsx y tailwind-merge para manejar conflictos de clases
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/**
 * Formatea una fecha YYYY-MM-DD como día local (evita desfase por UTC).
 * Ej: "2026-01-28" → "28 de Enero"
 */
export function formatDateOnly(dateString: string | null): string {
  if (!dateString) return "Fecha no disponible";
  const part = dateString.split("T")[0];
  const [y, m, d] = part.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateString;
  const month = MONTHS_ES[m - 1];
  if (!month) return dateString;
  return `${d} de ${month}`;
}

/**
 * Formatea una fecha YYYY-MM-DD con año. Ej: "2026-01-28" → "28 de enero de 2026"
 */
export function formatDateOnlyWithYear(dateString: string | null): string {
  if (!dateString) return "Fecha no disponible";
  const part = dateString.split("T")[0];
  const [y, m, d] = part.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return dateString;
  const month = MONTHS_ES[m - 1]?.toLowerCase() ?? m;
  return `${d} de ${month} de ${y}`;
}
