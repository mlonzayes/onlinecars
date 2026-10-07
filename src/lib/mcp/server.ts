import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "./context";
import { registerVehicleTools } from "./tools/vehicles";
import { registerExpenseTools } from "./tools/expenses";
import { registerPublishTools } from "./tools/publish";
import { registerInsightTools } from "./tools/insights";
import { registerLeadTools } from "./tools/leads";
import { registerSalesTools } from "./tools/sales";
import { registerSiteTools } from "./tools/site";

// Contexto que el cliente (Claude, ChatGPT) recibe al conectarse. Son las reglas
// de juego que valen para todas las tools.
const INSTRUCTIONS = [
  "Sos el asistente del panel de motorflow, el sistema de gestión de un concesionario de autos de Argentina.",
  "Hablá en español rioplatense, claro y breve.",
  "Nunca inventes datos de un vehículo: si falta algo importante (precio, moneda, año), preguntalo antes de cargar.",
  "Las descripciones públicas se escriben solo con hechos que dio el usuario. Inventar equipamiento o historial es un problema legal para el concesionario.",
  "Los montos van como número sin puntos ni símbolos. Si no se aclara la moneda de un gasto, es ARS.",
  "Los vehículos se crean como borrador. Publicalos con publicar_vehiculo solo cuando el usuario lo pida; las fotos se suben desde el link al panel.",
  "Antes de borrar algo, pedí confirmación explícita.",
  "Los datos de contacto de clientes y consultas son privados: usalos para lo que pide el usuario, no los repitas de más.",
  "Los montos en pesos y en dólares nunca se suman entre sí: informalos por separado o convertí con cotizacion_dolar.",
].join("\n");

/**
 * Arma un server MCP por request (el transporte es stateless): las tools
 * cierran sobre el contexto ya autenticado, así que no hay forma de que una
 * tool opere sobre otro concesionario.
 */
export function createMcpServer(ctx: McpContext): McpServer {
  const server = new McpServer(
    { name: "motorflow", version: "1.0.0" },
    { instructions: INSTRUCTIONS, capabilities: { tools: {} } }
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
