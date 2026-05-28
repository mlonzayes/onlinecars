// src/lib/vercel.ts
import { logger } from "@/lib/logger";

const VERCEL_API_URL = "https://api.vercel.com";

/**
 * Añade un dominio al proyecto de Vercel
 * Docs: https://vercel.com/docs/rest-api/endpoints#add-a-domain-to-a-project
 */
export async function addDomainToVercel(domain: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const token = process.env.VERCEL_API_TOKEN;

  if (!projectId || !token) {
    logger.warn(undefined, "VERCEL_PROJECT_ID o VERCEL_API_TOKEN no configurados. Saltando Vercel API.", { domain });
    return { success: false, error: "missing_env" };
  }

  let url = `${VERCEL_API_URL}/v10/projects/${projectId}/domains`;
  if (teamId) {
    url += `?teamId=${teamId}`;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      logger.error(undefined, "Error al añadir dominio en Vercel", { domain, status: res.status, data: errorData });
      return { success: false, error: errorData };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    logger.error(undefined, "Excepción al añadir dominio en Vercel", { domain, error });
    return { success: false, error };
  }
}

/**
 * Elimina un dominio del proyecto de Vercel
 * Docs: https://vercel.com/docs/rest-api/endpoints#remove-a-domain-from-a-project
 */
export async function removeDomainFromVercel(domain: string) {
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  const token = process.env.VERCEL_API_TOKEN;

  if (!projectId || !token) {
    logger.warn(undefined, "VERCEL_PROJECT_ID o VERCEL_API_TOKEN no configurados. Saltando Vercel API.", { domain });
    return { success: false, error: "missing_env" };
  }

  let url = `${VERCEL_API_URL}/v9/projects/${projectId}/domains/${domain}`;
  if (teamId) {
    url += `?teamId=${teamId}`;
  }

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      logger.error(undefined, "Error al eliminar dominio en Vercel", { domain, status: res.status, data: errorData });
      return { success: false, error: errorData };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error) {
    logger.error(undefined, "Excepción al eliminar dominio en Vercel", { domain, error });
    return { success: false, error };
  }
}
