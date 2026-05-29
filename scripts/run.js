/**
 * run.js
 * Executa um script k6 via MCP — sem agente de IA.
 *
 * Uso:
 *   node scripts/run.js <script> [--report] [vus] [duration]
 *
 * Exemplos:
 *   node scripts/run.js tests/smoke-pokeapi.js
 *   node scripts/run.js tests/smoke-pokeapi.js --report
 *   node scripts/run.js tests/load-quickpizza.js 10 2m
 *   node scripts/run.js tests/load-quickpizza.js --report 10 2m
 *
 * Nota: --report chama k6 diretamente (não via MCP), pois o MCP não expõe
 *       as variáveis do web dashboard (K6_WEB_DASHBOARD_EXPORT, etc.).
 */

import { readFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import { spawn } from "child_process";
import { callTool } from "./mcp-runner.js";

// Separa flags de args posicionais
const rawArgs   = process.argv.slice(2);
const reportFlag = rawArgs.includes("--report");
const positional = rawArgs.filter(a => !a.startsWith("--"));

const [scriptPath, vusArg, durationArg] = positional;

if (!scriptPath) {
  console.error("Uso: node scripts/run.js <caminho-do-script> [--report] [vus] [duration]");
  console.error("Exemplos:");
  console.error("  node scripts/run.js tests/smoke-pokeapi.js");
  console.error("  node scripts/run.js tests/smoke-pokeapi.js --report");
  console.error("  node scripts/run.js tests/load-quickpizza.js 10 2m");
  process.exit(1);
}

const absolutePath = resolve(scriptPath);
const vus          = vusArg      ? parseInt(vusArg, 10) : undefined;
const duration     = durationArg ?? undefined;

// ─── Modo --report: chama k6 diretamente com web dashboard ───────────────────
if (reportFlag) {
  mkdirSync("reports", { recursive: true });

  const timestamp  = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
  const reportFile = `reports/report_${timestamp}.html`;

  console.log(`\nExecutando: ${scriptPath}`);
  console.log(`Relatório:  ${reportFile}`);
  if (vus)      console.log(`VUs:        ${vus}`);
  if (duration) console.log(`Duration:   ${duration}`);
  console.log("─".repeat(50));

  const k6Args = ["run"];
  if (vus)      k6Args.push("--vus",      String(vus));
  if (duration) k6Args.push("--duration", duration);
  k6Args.push(absolutePath);

  const env = {
    ...process.env,
    K6_WEB_DASHBOARD:        "true",
    K6_WEB_DASHBOARD_OPEN:   "true",
    K6_WEB_DASHBOARD_EXPORT: reportFile,
  };

  const child = spawn("k6", k6Args, { env, stdio: "inherit" });
  child.on("close", (code) => {
    if (code === 0) {
      console.log(`\n✔ Relatório salvo em: ${reportFile}`);
    }
    process.exit(code ?? 0);
  });

// ─── Modo padrão: via MCP ─────────────────────────────────────────────────────
} else {
  const scriptContent = readFileSync(absolutePath, "utf-8");

  console.log(`\nExecutando: ${scriptPath}`);
  if (vus)      console.log(`VUs:        ${vus}`);
  if (duration) console.log(`Duration:   ${duration}`);
  console.log("─".repeat(50));

  const mcpArgs = { script: scriptContent };
  if (vus)      mcpArgs.vus      = vus;
  if (duration) mcpArgs.duration = duration;

  const result = await callTool("run_script", mcpArgs);
  const output = result?.content?.[0]?.text ?? JSON.stringify(result, null, 2);
  console.log(output);
}
