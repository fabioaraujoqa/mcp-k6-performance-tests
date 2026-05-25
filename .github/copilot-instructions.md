# k6 Performance Testing Template

## Estrutura do projeto

```
tests/          → scripts k6 (JavaScript)
docs/           → documentação e boas práticas de referência
reports/        → relatórios HTML gerados (gitignored)
run.sh          → helper para execução com modos dashboard/report
.env.example    → modelo de variáveis de ambiente
```

## Como executar testes

Via helper script:
```bash
./run.sh tests/script.js              # execução padrão (sem dashboard)
./run.sh tests/script.js --dashboard  # abre browser + dashboard ao vivo em http://localhost:5665
./run.sh tests/script.js --report     # abre browser + dashboard + exporta relatório HTML
```

O `--dashboard` usa `K6_WEB_DASHBOARD_OPEN=true` — o browser abre automaticamente. Não use `K6_WEB_DASHBOARD=true` sem `K6_WEB_DASHBOARD_OPEN=true` ou o browser não abrirá.

Para detalhes completos das variáveis do dashboard, consulte: [.github/skills/k6-dashboard/SKILL.md](.github/skills/k6-dashboard/SKILL.md)

Diretamente com k6:
```bash
k6 run tests/script.js
k6 run --env BASE_URL=https://staging.example.com tests/script.js
```

## Convenções de nomenclatura

Nomeie os scripts pelo tipo e alvo:
- `smoke-api.js`, `smoke-checkout.js`
- `load-homepage.js`, `load-auth.js`
- `stress-api.js`, `spike-checkout.js`
- `soak-full-flow.js`, `breakpoint-api.js`

## Fluxo obrigatório com MCP

Sempre que o k6 MCP estiver ativo, siga esta ordem:
1. `validate_script` — valida sintaxe e executa 1 VU / 1 iteração
2. `run_script` — executa o teste completo e retorna métricas
3. Analise os resultados antes de iterar
4. `get_documentation` — consulte a doc oficial quando necessário

Nunca execute `run_script` sem antes executar `validate_script`.

## Variáveis de ambiente

Use sempre `__ENV.VARIAVEL || 'fallback'` — nunca valores hardcoded:
```javascript
const BASE_URL = __ENV.BASE_URL || 'https://quickpizza.grafana.com';
const TOKEN    = __ENV.TOKEN    || '';
```

Credenciais ficam em `.env` local (gitignored). Use `.env.example` como modelo.

## Documentação interna

- Boas práticas completas: [docs/boas-praticas.md](../docs/boas-praticas.md)
- Tipos de teste, thresholds, stages, checks, grupos e tags estão documentados lá
