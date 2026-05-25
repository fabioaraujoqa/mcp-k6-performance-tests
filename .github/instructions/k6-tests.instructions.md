---
description: "Use when writing, reviewing, or modifying k6 test scripts. Covers required structure, thresholds, checks, sleep, ENV vars, tags and naming conventions."
applyTo: "tests/**/*.js"
---

# Padrões para scripts k6

## Estrutura obrigatória

Todo script deve ter:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. options com thresholds definidos
export const options = {
  thresholds: {
    http_req_failed:   ['rate<0.01'],   // < 1% de erros
    http_req_duration: ['p(95)<500'],   // p95 < 500ms
  },
};

// 2. função principal com checks + sleep
export default function () {
  const res = http.get(`${BASE_URL}/endpoint`);

  check(res, {
    'status é 200':          (r) => r.status === 200,
    'tempo < 500ms':         (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

## Regras inegociáveis

- **Thresholds obrigatórios** — todo script deve ter `http_req_failed` e `http_req_duration` em `options.thresholds`
- **Checks obrigatórios** — sempre validar status HTTP e tempo de resposta no mínimo
- **`sleep()` obrigatório** — simula think time do usuário; mínimo `sleep(1)` entre iterações
- **Sem URLs hardcoded** — use `__ENV.BASE_URL || 'https://fallback.example.com'`
- **Sem credenciais no código** — tokens e senhas via `__ENV.TOKEN`, nunca literais

## Variáveis de ambiente

```javascript
const BASE_URL = __ENV.BASE_URL || 'https://quickpizza.grafana.com';
const TOKEN    = __ENV.TOKEN    || '';
const VUS      = parseInt(__ENV.VUS)      || 10;
const DURATION = __ENV.DURATION           || '30s';
```

## Nomenclatura de arquivos

`<tipo>-<alvo>.js`:
- `smoke-api.js`, `smoke-auth.js`
- `load-checkout.js`, `load-homepage.js`
- `stress-api.js`, `spike-checkout.js`
- `soak-full-flow.js`, `breakpoint-api.js`

## Tags para isolar métricas

```javascript
http.get(`${BASE_URL}/api/pizza`,  { tags: { endpoint: 'pizza'  } });
http.post(`${BASE_URL}/api/order`, { tags: { endpoint: 'order'  } });
```

Com thresholds por tag:
```javascript
thresholds: {
  'http_req_duration{endpoint:pizza}':  ['p(95)<300'],
  'http_req_duration{endpoint:order}':  ['p(95)<800'],
},
```

## Stages por tipo de teste

| Tipo       | Configuração típica de stages |
|------------|-------------------------------|
| Smoke      | `vus: 1`, `duration: '30s'`   |
| Load       | Ramp-up → sustentação → ramp-down |
| Stress     | Escalonamento progressivo acima do normal |
| Spike      | Subida abrupta → pico → descida |
| Soak       | Baixo VU por longa duração (30min+) |
| Breakpoint | Incrementos até threshold `abortOnFail: true` |

Consulte [docs/boas-praticas.md](../../docs/boas-praticas.md) para exemplos completos de cada tipo.
