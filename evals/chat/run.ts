// Eval del chat del panel: compara modelos de OpenRouter con frases reales.
// Para cada caso manda el mensaje (con un historial armado si el caso lo pide)
// y corrige SOLO la primera respuesta: qué tool eligió y con qué argumentos.
// No ejecuta ninguna tool ni toca la DB. Sí gasta: unos centavos de dólar.
//
// Uso (necesita OPENROUTER_API_KEY en .env.local):
//   pnpm chat:eval --models <slug>,<slug>
//   (los slugs como figuran en openrouter.ai/models, ej: proveedor/modelo)
//   --only expense-lucas   → corre un solo caso
//   --list-tools           → solo imprime las tools que ve el modelo (no gasta)
//
// El script carga preload.cjs porque las tools importan módulos con
// `import "server-only"`, que fuera de Next no resuelve.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type OpenAI from "openai";
import "@/lib/prisma"; // carga .env.local
import { completeChat } from "@/lib/chat/client";
import { openMcpBridge, toOpenAiTools } from "@/lib/chat/mcp-bridge";
import { CHAT_SYSTEM_PROMPT } from "@/lib/chat/system-prompt";
import type { DealershipWithUser } from "@/lib/auth";
import { caseCategory, gradeResponse, type EvalCase } from "./grade";

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

interface Fixture {
  userMessage: string;
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

interface EvalFile {
  fixtures: Record<string, Fixture>;
  cases: EvalCase[];
}

const CONCURRENCY = 4;

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function buildMessages(c: EvalCase, fixtures: Record<string, Fixture>): Message[] {
  const messages: Message[] = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
    { role: "system", content: "Concesionario: Autos del Sur. Hoy es 2026-10-26. Moneda por defecto: ARS." },
  ];
  const fixture = c.fixture ? fixtures[c.fixture] : undefined;
  if (c.fixture && !fixture) throw new Error(`Fixture inexistente: ${c.fixture}`);
  if (fixture) {
    messages.push(
      { role: "user", content: fixture.userMessage },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          { id: "call_fx", type: "function", function: { name: fixture.tool, arguments: JSON.stringify(fixture.args) } },
        ],
      },
      { role: "tool", tool_call_id: "call_fx", content: JSON.stringify(fixture.result) }
    );
  }
  messages.push({ role: "user", content: c.message });
  return messages;
}

// Solo para listar las tools: ninguna se ejecuta, así que no hace falta un
// concesionario real.
const FAKE_DEALERSHIP = {
  id: "eval",
  name: "Autos del Sur",
  timezone: "America/Argentina/Buenos_Aires",
  currency: "ARS",
} as unknown as DealershipWithUser;

async function runModel(model: string, cases: EvalCase[], file: EvalFile, tools: OpenAI.Chat.Completions.ChatCompletionTool[]) {
  const results: { c: EvalCase; pass: boolean; reason: string; costUsd: number; ms: number }[] = [];
  let next = 0;

  async function worker() {
    while (next < cases.length) {
      const c = cases[next++];
      const startedAt = Date.now();
      try {
        const { message, usage } = await completeChat(buildMessages(c, file.fixtures), tools, model);
        const grade = gradeResponse(c.expect, message);
        results.push({ c, ...grade, costUsd: usage.costUsd, ms: Date.now() - startedAt });
      } catch (error) {
        const reason = `error: ${error instanceof Error ? error.message : String(error)}`;
        results.push({ c, pass: false, reason, costUsd: 0, ms: Date.now() - startedAt });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

function pct(n: number, total: number): string {
  return total === 0 ? "-" : `${Math.round((n / total) * 100)}%`;
}

async function main() {
  const bridge = await openMcpBridge({ requestId: "eval", dealership: FAKE_DEALERSHIP, source: "chat", appOrigin: "http://localhost:3000" });
  const tools = toOpenAiTools(bridge.tools);
  await bridge.close();

  if (process.argv.includes("--list-tools")) {
    for (const t of tools) if (t.type === "function") console.log(`${t.function.name}: ${t.function.description}`);
    return;
  }

  const models = (argValue("--models") ?? "").split(",").filter(Boolean);
  if (models.length === 0) throw new Error("Pasá los modelos con --models a,b,c");

  const file = JSON.parse(readFileSync(resolve(process.cwd(), "evals/chat/cases.json"), "utf8")) as EvalFile;
  const only = argValue("--only");
  const cases = only ? file.cases.filter((c) => c.id === only) : file.cases;

  for (const model of models) {
    const results = await runModel(model, cases, file, tools);
    const byCategory = new Map<string, { pass: number; total: number }>();
    for (const r of results) {
      const cat = caseCategory(r.c);
      const entry = byCategory.get(cat) ?? { pass: 0, total: 0 };
      entry.total += 1;
      if (r.pass) entry.pass += 1;
      byCategory.set(cat, entry);
    }
    const passed = results.filter((r) => r.pass).length;
    const cost = results.reduce((sum, r) => sum + r.costUsd, 0);
    const avgMs = results.reduce((sum, r) => sum + r.ms, 0) / Math.max(results.length, 1);

    console.log(`\n=== ${model}`);
    console.log(`Total: ${pct(passed, results.length)} (${passed}/${results.length})`);
    for (const [cat, { pass, total }] of byCategory) console.log(`  ${cat}: ${pct(pass, total)} (${pass}/${total})`);
    console.log(`Costo: USD ${cost.toFixed(4)} total · USD ${(cost / Math.max(results.length, 1)).toFixed(5)} por mensaje`);
    console.log(`Latencia promedio: ${Math.round(avgMs)} ms`);
    for (const r of results.filter((r) => !r.pass)) console.log(`  ✗ ${r.c.id}: ${r.reason}`);
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
