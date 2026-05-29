# k6 Performance Testing Template

Template reusável para testes de performance com k6 + GitHub Copilot Agent Mode.

Inclui scripts de exemplo, boas práticas, agent instructions, guardrails e prompts prontos para uso.

> **Dois modos de uso:** via **agente de IA** (Copilot Agent Mode — loop autônomo, geração e análise) ou via **scripts Node.js diretos** (`scripts/`) — sem IA, ideal para CI/CD e automação.

## Configuração do MCP

Este projeto usa configuração local do MCP (arquivo `.vscode/mcp.json`).

Repositório oficial: [grafana/mcp-k6](https://github.com/grafana/mcp-k6)

## Pré-requisitos

- **k6** e **mcp-k6** instalados via Homebrew (macOS):
  ```bash
  brew tap grafana/grafana
  brew install mcp-k6
  ```

- Ou via **Docker** (sem instalação local necessária).

## Uso

Com o arquivo `.vscode/mcp.json` configurado, o VS Code irá automaticamente usar o k6 MCP quando este workspace estiver aberto.

## Tipos de teste suportados

Todos os tipos são suportados — são configurações diferentes de `stages`, `vus` e `duration`:

| Tipo | Característica | Prompt de exemplo |
|---|---|---|
| **Smoke** | Validação mínima, 1-2 VUs | *"Faz um smoke test no /api/pizza para garantir que está respondendo 200"* |
| **Load** | Carga esperada normal | *"Simula 50 usuários simultâneos por 5 minutos no quickpizza e me mostra o p95"* |
| **Stress** | Acima do limite normal | *"Aumenta gradualmente de 10 para 200 VUs em 10 min e vê onde começa a degradar"* |
| **Spike** | Pico repentino | *"Sobe de 1 para 100 VUs em 10s, mantém por 1 min e desce. O p95 passou de 1s?"* |
| **Soak** | Longa duração | *"Roda 20 VUs constantes por 30 minutos e verifica se há degradação ao longo do tempo"* |
| **Breakpoint** | Sobe até o ponto de ruptura | *"Aumenta 10 VUs a cada 1 minuto sem parar até a taxa de erro passar de 5%"* |

### Exemplo de prompt completo com loop autônomo

> *"Cria e executa um teste de spike no https://quickpizza.grafana.com — sobe de 1 para 100 VUs em 10s, mantém por 1 min e desce. Se o p95 passar de 1s ou a taxa de erro passar de 1%, ajusta os stages e roda de novo."*

Com o MCP ativo, o agente gera o script, valida, executa, analisa e itera — tudo no chat.

## Por que usar o MCP do k6?

### Ferramentas disponíveis para o agente

| Ferramenta | O que faz |
|---|---|
| `validate_script` | Valida o script (1 VU, 1 iteração) antes de rodar |
| `run_script` | Executa o teste e retorna métricas |
| `list_sections` | Navega na documentação oficial do k6 |
| `get_documentation` | Busca o conteúdo real da doc por slug |

### A real vantagem: o loop fechado

**Sem MCP** — o Copilot é "cego":
```
você escreve → roda no terminal → copia resultado → cola no chat → pede análise
```

**Com MCP** — o agente fecha o ciclo sozinho:
```
"cria um teste com stages para o quickpizza"
  → gera script com best practices da doc atual
  → valida antes de rodar
  → executa
  → analisa os resultados
  → sugere ajustes
  → roda de novo
```

Ou seja: **geração + validação + execução + análise em uma única conversa**, sem sair do editor.

### Exemplo de prompt com MCP ativo

> *"Gera um teste de carga com stages progressivos para https://quickpizza.grafana.com/api/pizza, valida e executa. Se o p95 passar de 500ms, ajusta e roda de novo."*

O agente faz tudo sozinho — esse loop autônomo é o que diferencia usar o MCP de apenas pedir ao Copilot para gerar código.

## Copilot Agent Mode

Este template inclui um agente especializado, instructions automáticas e prompts prontos que transformam o Copilot num engenheiro de performance k6 autônomo.

### Agente: `k6 Engineer`

Selecione `@k6 Engineer` no chat do VS Code. Ele:

- Gera scripts seguindo as boas práticas automaticamente
- Executa `validate_script` antes de qualquer `run_script`
- Analisa os resultados e itera até os thresholds passarem (máx. 3 tentativas)
- Avisa se a URL parece ser de produção ou se os VUs são altos
- Reporta um diagnóstico estruturado ao final com métricas, causa raiz e próximos passos

### Prompts disponíveis

Digite `/` no chat para ver os prompts. Todos usam o k6 MCP automaticamente.

| Prompt | Quando usar |
|---|---|
| `/criar-teste` | Criar um script novo do zero a partir de URL + tipo de teste |
| `/analisar-resultado` | Colar métricas do k6 e receber análise estruturada com diagnóstico |
| `/loop-autonomo` | Ciclo completo: gera → valida → executa → analisa → itera |

**Exemplo com `/loop-autonomo`:**
> `/loop-autonomo` `https://quickpizza.grafana.com, spike test, p95 < 800ms e error rate < 1%`
>
> O agente gera o script, valida, executa, analisa e ajusta os stages automaticamente se os thresholds falharem.

### Instructions automáticas

Dois arquivos de instrução ficam sempre ativos no workspace:

| Arquivo | Modo | O que faz |
|---|---|---|
| `k6-tests.instructions.md` | Auto — aplicado a `tests/**/*.js` | Exige thresholds, checks, sleep e ENV vars em todo script |
| `k6-guardrails.instructions.md` | On-demand | Bloqueia credenciais hardcoded, alerta VUs altos e proteção de produção |

Qualquer script criado ou editado em `tests/` recebe as regras de `k6-tests` automaticamente — sem precisar mencionar.

### Base de conhecimento do agente

O arquivo [`docs/boas-praticas.md`](docs/boas-praticas.md) funciona como **RAG local**: o agente lê esse arquivo via `read_file` quando precisa dos templates corretos de stages, thresholds e checks para cada tipo de teste. Mantenha-o atualizado para manter o agente calibrado.

---

## Estrutura

```
.github/
  copilot-instructions.md          → contexto always-on do projeto para o agente
  agents/
    k6-engineer.agent.md           → agente especializado com loop autônomo
  instructions/
    k6-tests.instructions.md       → padrões aplicados a tests/**/*.js
    k6-guardrails.instructions.md  → guardrails de segurança (on-demand)
  prompts/
    criar-teste.prompt.md          → /criar-teste — cria script do zero
    analisar-resultado.prompt.md   → /analisar-resultado — analisa métricas
    loop-autonomo.prompt.md        → /loop-autonomo — ciclo completo autônomo
.vscode/
  mcp.json                         → configuração local do k6 MCP Server
scripts/                           → cliente MCP sem agente (Node.js direto)
  mcp-runner.js                    → cria e conecta o cliente MCP
  validate.js                      → CLI: valida um script k6
  run.js                           → CLI: executa um script k6
  README.md                        → documentação detalhada dos scripts
tests/
  quickpizza.js                    → script de exemplo
docs/
  boas-praticas.md                 → referência completa + base de conhecimento do agente
package.json                       → dependência @modelcontextprotocol/sdk
run.sh                             → helper para execução com/sem dashboard
.env.example                       → modelo de variáveis de ambiente
reports/                           → relatórios HTML gerados (gitignored)
```

## Executando testes

```bash
# Execução padrão
./run.sh tests/quickpizza.js

# Com dashboard ao vivo em http://localhost:5665
./run.sh tests/quickpizza.js --dashboard

# Com dashboard + exportar relatório HTML (salvo em reports/)
./run.sh tests/quickpizza.js --report
```

## Usando o MCP sem agente de IA

A pasta [`scripts/`](scripts/) contém um cliente MCP em Node.js para chamar as tools do k6 diretamente — sem Copilot, sem LLM, sem VS Code.

```bash
npm install

# Valida o script (1 VU, 1 iteração)
node scripts/validate.js tests/smoke-pokeapi.js

# Executa o teste
node scripts/run.js tests/smoke-pokeapi.js

# Sobrescreve VUs e duração
node scripts/run.js tests/load-quickpizza.js 10 2m
```

Ideal para **pipelines de CI/CD** onde você quer o MCP sem depender de um agente. Veja [`scripts/README.md`](scripts/README.md) para detalhes.

---

## Referências

Fontes oficiais que embasam as convenções, fluxos e guardrails deste template:

| Fonte | O que cobre |
|---|---|
| [k6 Docs — Web Dashboard](https://grafana.com/docs/k6/latest/results-output/web-dashboard/) | Variáveis de ambiente do dashboard (`K6_WEB_DASHBOARD_OPEN`, `K6_WEB_DASHBOARD_EXPORT`, etc.) |
| [k6 Docs — Configure AI assistant (MCP)](https://grafana.com/docs/k6/latest/set-up/configure-ai-assistant/) | Ferramentas MCP, recursos (`docs://k6/best_practices`, `types://k6/...`) e prompts nativos |
| [grafana/mcp-k6 — GitHub](https://github.com/grafana/mcp-k6) | Repositório oficial do servidor MCP k6 |
| [k6 Docs — Test types](https://grafana.com/docs/k6/latest/testing-guides/test-types/) | Definição de smoke, load, stress, spike, soak e breakpoint |
| [VS Code — Agent Customization](https://code.visualstudio.com/docs/copilot/customization/overview) | Estrutura de `.instructions.md`, `.prompt.md`, `.agent.md` e `SKILL.md` |
