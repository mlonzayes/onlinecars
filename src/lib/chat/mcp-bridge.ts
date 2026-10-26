import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import type OpenAI from "openai";
import { createMcpServer } from "@/lib/mcp/server";
import type { McpContext } from "@/lib/mcp/context";

// El chat no reimplementa ninguna tool: conecta un cliente MCP EN MEMORIA al
// mismo server que usan Claude y ChatGPT. Permisos, guard de venta, límite del
// plan e invalidación de cache siguen viviendo en los servicios, y cada tool
// nueva del MCP aparece sola en el chat.

export interface McpBridge {
  tools: Tool[];
  callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult>;
  close(): Promise<void>;
}

export async function openMcpBridge(ctx: McpContext): Promise<McpBridge> {
  const server = createMcpServer(ctx);
  const client = new Client({ name: "motorflow-chat", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);
  await client.connect(clientTransport);
  const { tools } = await client.listTools();

  return {
    tools,
    async callTool(name, args) {
      return (await client.callTool({ name, arguments: args })) as CallToolResult;
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}

/** Definiciones de las tools MCP en el formato de la API de OpenAI/OpenRouter. */
export function toOpenAiTools(tools: Tool[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description ?? tool.title ?? tool.name,
      parameters: tool.inputSchema as Record<string, unknown>,
    },
  }));
}

/** El texto que devuelve una tool (runTool siempre devuelve un bloque de texto). */
export function toolResultText(result: CallToolResult): string {
  return result.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}
