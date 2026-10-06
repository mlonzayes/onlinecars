// Paginación de los listados de los servicios. Fija y chica a propósito: los
// consume el MCP, y cada fila que vuelve ocupa contexto de la IA.
export const SERVICE_PAGE_SIZE = 20;

export function pageArgs(page: number) {
  return { skip: (Math.max(1, page) - 1) * SERVICE_PAGE_SIZE, take: SERVICE_PAGE_SIZE };
}

export function pageMeta(total: number, page: number) {
  return { total, pagina: page, totalPaginas: Math.max(1, Math.ceil(total / SERVICE_PAGE_SIZE)) };
}

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}
