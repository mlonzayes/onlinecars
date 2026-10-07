import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getClerkIssuerUrl, isMcpEnabled, METADATA_CORS_HEADERS } from "@/lib/mcp/oauth";

// Authorization Server Metadata (RFC 8414) de Clerk, reexpuesta en nuestro
// dominio. Los clientes MCP que siguen la versión vieja de la spec la buscan en
// el host del recurso en vez de en el issuer. Es un proxy: Clerk es la fuente.

export const GET = withLogger(async (_request, { requestId }) => {
  if (!isMcpEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const issuer = getClerkIssuerUrl();
  const res = await fetch(`${issuer}/.well-known/oauth-authorization-server`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    logger.error(requestId, "mcp.auth_server_metadata.failed", { status: res.status });
    return NextResponse.json({ error: "Metadata no disponible" }, { status: 502 });
  }

  const metadata: unknown = await res.json();
  return NextResponse.json(metadata, {
    headers: { ...METADATA_CORS_HEADERS, "Cache-Control": "public, max-age=3600" },
  });
});

export function OPTIONS() {
  return new Response(null, { status: 204, headers: METADATA_CORS_HEADERS });
}
