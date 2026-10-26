import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "./context";
import { registerVehicleTools } from "./tools/vehicles";
import { registerExpenseTools } from "./tools/expenses";
import { registerPublishTools } from "./tools/publish";
import { registerInsightTools } from "./tools/insights";
import { registerLeadTools } from "./tools/leads";
import { registerSalesTools } from "./tools/sales";
import { registerSiteTools } from "./tools/site";
import { MCP_INSTRUCTIONS } from "./instructions";

/**
 * Arma un server MCP por request (el transporte es stateless): las tools
 * cierran sobre el contexto ya autenticado, así que no hay forma de que una
 * tool opere sobre otro concesionario.
 */
export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(
    { name: "motorflow", version: "1.0.0" },
    { instructions: MCP_INSTRUCTIONS, capabilities: { tools: {} } }
  );
  registerVehicleTools(server, ctx);
  registerPublishTools(server, ctx);
  registerExpenseTools(server, ctx);
  registerInsightTools(server, ctx);
  registerLeadTools(server, ctx);
  registerSalesTools(server, ctx);
  registerSiteTools(server, ctx);
  return server;
}
