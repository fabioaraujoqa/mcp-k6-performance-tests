/**
 * validate.js
 * Valida um script k6 (1 VU, 1 iteração) via MCP — sem agente de IA.
 *
 * Uso:
 *   node scripts/validate.js tests/smoke-pokeapi.js
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { callTool } from "./mcp-runner.js";

const scriptPath = process.argv[2];

if (!scriptPath) {
  console.error("Uso: node scripts/validate.js <caminho-do-script>");
  console.error("Exemplo: node scripts/validate.js tests/smoke-pokeapi.js");
  process.exit(1);
}

const absolutePath = resolve(scriptPath);
const scriptContent = readFileSync(absolutePath, "utf-8");

console.log(`\nValidando: ${scriptPath}\n${"─".repeat(50)}`);

const result = await callTool("validate_script", { script: scriptContent });

// O MCP retorna content[0].text com o JSON de resultado
const output = result?.content?.[0]?.text ?? JSON.stringify(result, null, 2);
console.log(output);
