import { NextResponse } from "next/server";
import { withLogger } from "@/lib/api-handler";
import {
  buildProtectedResourceMetadata,
  isMcpEnabled,
  METADATA_CORS_HEADERS,
} from "@/lib/mcp/oauth";

// OAuth Protected Resource Metadata (RFC 9728) del MCP. El cliente la pide
// después del 401 de /api/mcp para saber qué authorization server usar (Clerk).
// Se sirve en /.well-known/oauth-protected-resource y también con el path del
// recurso como sufijo (/.well-known/oauth-protected-resource/api/mcp), que es
// como lo pide la spec nueva.
//
// Response 200:
//   { "resource": "https://app.motorflowapp.com/api/mcp",
//     "authorization_servers": ["https://clerk.motorflowapp.com"],
//     "bearer_methods_supported": ["header"], "resource_name": "motorflow" }

export const GET = withLogger(async (request) => {
  if (!isMcpEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(buildProtectedResourceMetadata(request), {
    headers: { ...METADATA_CORS_HEADERS, "Cache-Control": "public, max-age=3600" },
  });
});

export function OPTIONS() {
  return new Response(null, { status: 204, headers: METADATA_CORS_HEADERS });
}
