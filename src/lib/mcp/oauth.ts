import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// OAuth del MCP: Clerk es el authorization server y /api/mcp es el resource
// server. Los clientes (Claude, ChatGPT) descubren todo por las metadata de
// RFC 9728 (protected resource) y RFC 8414 (authorization server).
//
// Sin Dynamic Client Registration: cada cliente usa una OAuth app creada a mano
// en Clerk, y solo sus client IDs (MCP_OAUTH_CLIENT_IDS) pueden entrar.

export const MCP_PATH = "/api/mcp";
export const PROTECTED_RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";

export const METADATA_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

/**
 * Client IDs de las OAuth apps habilitadas. Su PRESENCIA es el interruptor del
 * MCP: vacía = el endpoint no existe (404). Mismo criterio que el pixel de Meta.
 */
export function getAllowedClientIds(): Set<string> {
  const raw = process.env.MCP_OAUTH_CLIENT_IDS ?? "";
  return new Set(raw.split(",").map((id) => id.trim()).filter(Boolean));
}

export function isMcpEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_LOGIN === "true" && getAllowedClientIds().size > 0;
}

/**
 * URL de la Frontend API de Clerk (el issuer OAuth). Viene codificada en base64
 * dentro de la publishable key: `pk_live_<base64("clerk.dominio.com$")>`.
 */
export function getClerkIssuerUrl(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const encoded = key.split("_")[2] ?? "";
  const host = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  if (!host) throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY inválida o ausente");
  return `https://${host}`;
}

export function getMcpResourceUrl(request: Request): string {
  return `${new URL(request.url).origin}${MCP_PATH}`;
}

export function buildProtectedResourceMetadata(request: Request) {
  return {
    resource: getMcpResourceUrl(request),
    authorization_servers: [getClerkIssuerUrl()],
    bearer_methods_supported: ["header"],
    resource_name: "motorflow",
  };
}

/** 401 con el header que le dice al cliente dónde arrancar el flujo OAuth. */
export function unauthorizedResponse(request: Request, error = "invalid_token"): NextResponse {
  const metadataUrl = `${new URL(request.url).origin}${PROTECTED_RESOURCE_METADATA_PATH}${MCP_PATH}`;
  return NextResponse.json(
    { error: "No autorizado" },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer error="${error}", resource_metadata="${metadataUrl}"`,
      },
    }
  );
}

export interface McpTokenInfo {
  userId: string;
  clientId: string;
}

/**
 * Valida el access token OAuth (emitido por Clerk) del header Authorization.
 * Devuelve null si falta, es inválido o es de una OAuth app no habilitada.
 */
export async function verifyMcpToken(): Promise<McpTokenInfo | null> {
  const authObject = await auth({ acceptsToken: "oauth_token" });
  if (!authObject.isAuthenticated || !authObject.userId || !authObject.clientId) return null;
  if (!getAllowedClientIds().has(authObject.clientId)) return null;
  return { userId: authObject.userId, clientId: authObject.clientId };
}
