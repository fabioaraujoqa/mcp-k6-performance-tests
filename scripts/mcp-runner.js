/**
 * mcp-runner.js
 * Cliente MCP base para chamar tools do k6 sem agente de IA.
 *
 * Usado pelos scripts validate.js e run.js como camada de transporte.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * Cria e conecta um cliente MCP ao servidor mcp-k6 local.
 * @returns {Promise<Client>} cliente conectado
 */
export async function createClient() {
  const client = new Client({ name: "k6-runner", version: "1.0.0" });

  const transport = new StdioClientTransport({
    command: "mcp-k6",   // instalado via: brew install mcp-k6
    args: [],
  });

  await client.connect(transport);
  return client;
}

/**
 * Chama uma tool do MCP e retorna o resultado.
 * @param {string} toolName  - ex: "validate_script" | "run_script"
 * @param {object} args      - argumentos da tool
 * @returns {Promise<object>}
 */
export async function callTool(toolName, args) {
  const client = await createClient();
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  } finally {
    await client.close();
  }
}
