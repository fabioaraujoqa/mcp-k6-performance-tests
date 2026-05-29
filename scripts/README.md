# scripts/ — Cliente MCP sem agente de IA

Esta pasta contém scripts Node.js para acionar o k6 MCP **diretamente**, sem passar por um agente de IA.

Útil para **pipelines de CI/CD**, automações e qualquer situação onde você quer o poder do MCP mas com controle total do fluxo — sem LLM no caminho.

---

## Como funciona

O k6 MCP expõe tools (`validate_script`, `run_script`, etc.) via protocolo MCP. Normalmente essas tools são chamadas por um agente (Copilot, Claude, etc.). Aqui, o cliente Node.js chama as tools diretamente:

```
tests/smoke-api.js
       │
       ▼
  scripts/run.js          ← você executa
       │
       ▼
  mcp-runner.js           ← cria o cliente MCP
       │  @modelcontextprotocol/sdk
       ▼
  mcp-k6 (binário local)  ← servidor MCP
       │
       ▼
  k6 (binário local)      ← executa o teste
```

Sem IA. Sem loop autônomo. Apenas: **você → MCP → k6 → resultado**.

---

## Pré-requisitos

O binário `mcp-k6` deve estar instalado:

```bash
brew tap grafana/grafana
brew install mcp-k6
```

Instale as dependências Node.js (apenas `@modelcontextprotocol/sdk`):

```bash
npm install
```

---

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `mcp-runner.js` | Cria e conecta o cliente MCP. Camada base usada pelos outros scripts. |
| `validate.js` | CLI para validar um script k6 (1 VU, 1 iteração). Equivale a `validate_script`. |
| `run.js` | CLI para executar um script k6 com parâmetros opcionais de VUs e duração. Equivale a `run_script`. |

---

## Uso

### Validar um script

```bash
node scripts/validate.js tests/smoke-pokeapi.js
```

Executa 1 VU / 1 iteração e retorna o resultado da validação. Use **sempre antes de rodar**.

### Executar um teste

```bash
# Usa as configurações definidas dentro do próprio script (options {})
node scripts/run.js tests/smoke-pokeapi.js

# Sobrescreve VUs e duração
node scripts/run.js tests/load-quickpizza.js 10 2m

# Gera relatório HTML em reports/ (abre o browser com o dashboard)
node scripts/run.js tests/smoke-pokeapi.js --report

# --report com VUs e duração explícitos
node scripts/run.js tests/load-quickpizza.js --report 10 2m
```

> **Por que `--report` não usa o MCP?**
> O `run_script` do MCP não expõe as variáveis do web dashboard do k6
> (`K6_WEB_DASHBOARD_EXPORT`, etc.). Quando `--report` é passado, o script
> chama o binário `k6` diretamente — igual ao `run.sh --report` — e salva
> o arquivo em `reports/report_<timestamp>.html`.

### Via npm scripts

```bash
# Valida (edite package.json para apontar pro script desejado)
npm run validate

# Executa
npm run run-test
```

---

## Diferença em relação ao agente

| | Agente (`@k6 Engineer`) | Scripts (`scripts/`) |
|---|---|---|
| Orquestração | IA (Copilot/LLM) | Você ou CI/CD |
| Loop de análise | Automático — analisa e itera | Manual |
| Geração de script | Sim | Não (script já deve existir) |
| Ideal para | Exploração interativa no editor | Pipelines, automação, reproducibilidade |
| Requer VS Code | Sim | Não |

Os dois caminhos chamam o **mesmo `mcp-k6`** — a diferença é só quem orquestra.

---

## Variáveis de ambiente

Os scripts k6 em `tests/` leem variáveis via `__ENV`. Passe-as com `--env` se chamar `mcp-k6` diretamente, ou exporte antes de rodar:

```bash
BASE_URL=https://staging.example.com node scripts/run.js tests/smoke-api.js
```

Ou use o arquivo `.env` (lido manualmente se necessário — k6 não carrega `.env` automaticamente).

---

## Exemplo de uso em CI/CD (GitHub Actions)

```yaml
- name: Validate k6 script
  run: node scripts/validate.js tests/smoke-api.js

- name: Run smoke test
  run: node scripts/run.js tests/smoke-api.js 2 30s
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
```
