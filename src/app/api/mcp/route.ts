import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { getDealershipForUser } from "@/lib/auth";
import { applyRateLimit, mcpLimiter } from "@/lib/rate-limit";
import { isMcpEnabled, unauthorizedResponse, verifyMcpToken } from "@/lib/mcp/oauth";
import { createMcpServer } from "@/lib/mcp/server";

// Endpoint MCP (Streamable HTTP, stateless). Lo usan Claude y ChatGPT como
// "conector personalizado" para operar el panel del concesionario.
//
// Ejemplo (JSON-RPC sobre HTTP, con el access token OAuth de Clerk):
//   POST /api/mcp
//   Authorization: Bearer <token>
//   Accept: application/json, text/event-stream
//   { "jsonrpc": "2.0", "id": 1, "method": "tools/call",
//     "params": { "name": "buscar_vehiculos", "arguments": { "texto": "corolla" } } }
// Response 200:
//   { "jsonrpc": "2.0", "id": 1, "result": { "content": [{ "type": "text", "text": "{ ... }" }] } }
// Response 401 (sin token): header WWW-Authenticate con resource_metadata → arranca el login OAuth.

// Las tools tocan Prisma y Redis: runtime Node, nunca edge.
export const runtime = "nodejs";

const handler = withLogger(async (request, { requestId }) => {
  if (!isMcpEnabled()) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const token = await verifyMcpToken();
  if (!token) {
    logger.warn(requestId, "mcp.unauthorized");
    return unauthorizedResponse(request);
  }

  const rl = await applyRateLimit(mcpLimiter, token.userId, requestId, { channel: "mcp" });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Esperá un minuto." },
      { status: 429, headers: rl.headers }
    );
  }

  const dealership = await getDealershipForUser(token.userId);
  if (!dealership) {
    logger.warn(requestId, "mcp.no_dealership", { userId: token.userId });
    return NextResponse.json(
      { error: "Tu usuario no pertenece a ningún concesionario de motorflow." },
      { status: 403 }
    );
  }

  const server = createMcpServer({
    requestId,
    dealership,
    source: "mcp",
    appOrigin: new URL(request.url).origin,
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);

  try {
    return await transport.handleRequest(request);
  } finally {
    await server.close();
  }
});

export { handler as GET, handler as POST, handler as DELETE };
