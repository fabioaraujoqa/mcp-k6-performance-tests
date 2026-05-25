# Boas Práticas k6

Documento de referência para geração de scripts k6 com qualidade, baseado na documentação oficial da Grafana.

> Este documento serve tanto como referência para humanos quanto como base de conhecimento para o agente `k6 Engineer` — ele o lê via `read_file` para obter templates corretos por tipo de teste.

**Índice:** [1. Estrutura básica](#1-estrutura-básica-de-um-script) · [2. Checks](#2-checks) · [3. Thresholds](#3-thresholds-critérios-de-aprovaçãoreprovação) · [4. Tipos de teste](#4-tipos-de-teste-e-configuração-de-stages) · [5. Groups e Tags](#5-organização-com-groups-e-tags) · [6. Métricas](#6-métricas-importantes-para-análise) · [7. Boas práticas](#7-boas-práticas-gerais) · [8. ENV vars](#8-variáveis-de-ambiente-env) · [9. Dashboard](#9-web-dashboard-e-relatório-html) · [10. Referências](#10-referências)

---

## 1. Estrutura básica de um script

Todo script k6 deve seguir esta estrutura:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Configurações do teste
export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],      // taxa de erro < 1%
    http_req_duration: ['p(95)<500'],    // 95% das requisições < 500ms
  },
};

// Função principal executada por cada VU
export default function () {
  const res = http.get('https://example.com/api/endpoint');

  check(res, {
    'status é 200': (r) => r.status === 200,
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // simula tempo de "pensar" do usuário
}
```

---

## 2. Checks

Checks validam condições booleanas durante o teste. Não interrompem o teste em caso de falha — apenas registram a taxa de sucesso/falha.

```javascript
import { check } from 'k6';
import http from 'k6/http';

export default function () {
  const res = http.get('https://example.com/');

  check(res, {
    'status é 200':              (r) => r.status === 200,
    'corpo contém token':        (r) => r.body.includes('token'),
    'resposta < 1000 bytes':     (r) => r.body.length < 1000,
    'tempo de resposta < 500ms': (r) => r.timings.duration < 500,
  });
}
```

> **Atenção:** Checks não reprovam o teste sozinhos. Para reprovar o teste com base em checks, combine-os com thresholds (ver seção 3).

---

## 3. Thresholds (critérios de aprovação/reprovação)

Thresholds definem os SLOs (Service Level Objectives) do teste. Se não forem atingidos, o k6 retorna exit code não-zero — ideal para pipelines de CI/CD.

```javascript
export const options = {
  thresholds: {
    // Taxa de erro HTTP deve ser menor que 1%
    http_req_failed: ['rate<0.01'],

    // 90% das requisições devem responder em menos de 400ms
    // 95% em menos de 800ms
    // 99.9% em menos de 2s
    http_req_duration: ['p(90)<400', 'p(95)<800', 'p(99.9)<2000'],

    // Taxa de checks com sucesso deve ser maior que 95%
    checks: ['rate>0.95'],
  },
};
```

### Abortar o teste ao cruzar um threshold

```javascript
export const options = {
  thresholds: {
    http_req_duration: [
      {
        threshold: 'p(99)<500',
        abortOnFail: true,
        delayAbortEval: '10s', // aguarda 10s antes de avaliar
      },
    ],
  },
};
```

### Threshold por tag (endpoint específico)

```javascript
export const options = {
  thresholds: {
    'http_req_duration{type:API}':           ['p(95)<500'],
    'http_req_duration{type:staticContent}': ['p(95)<200'],
  },
};

export default function () {
  http.get('https://example.com/api/data',  { tags: { type: 'API' } });
  http.get('https://example.com/logo.png',  { tags: { type: 'staticContent' } });
}
```

---

## 4. Tipos de teste e configuração de stages

### Smoke Test — validação mínima

```javascript
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: { http_req_failed: ['rate<0.01'] },
};
```

### Load Test — carga normal esperada

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 50 },  // sobe para 50 VUs
    { duration: '5m', target: 50 },  // mantém 50 VUs
    { duration: '2m', target: 0 },   // desce para 0
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};
```

### Stress Test — além do limite normal

```javascript
export const options = {
  stages: [
    { duration: '2m',  target: 50  },
    { duration: '5m',  target: 100 },
    { duration: '2m',  target: 200 },
    { duration: '5m',  target: 200 },
    { duration: '2m',  target: 0   },
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],    // tolerância maior — estamos além do normal
    http_req_duration: ['p(95)<2000'],
  },
};
```

### Spike Test — pico repentino

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 1   },  // baseline
    { duration: '10s', target: 100 },  // spike
    { duration: '1m',  target: 100 },  // mantém pico
    { duration: '10s', target: 1   },  // volta ao normal
    { duration: '30s', target: 1   },  // recuperação
  ],
  thresholds: {
    http_req_failed:   ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],  // tolerância maior durante o pico
  },
};
```

### Soak Test — longa duração

```javascript
export const options = {
  stages: [
    { duration: '5m',  target: 20 },  // aquecimento
    { duration: '30m', target: 20 },  // sustentação longa
    { duration: '5m',  target: 0  },  // desaquecimento
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<500'],  // detecta degradação ao longo do tempo
    checks:            ['rate>0.95'],
  },
};
```

### Breakpoint Test — até o ponto de ruptura

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 10  },
    { duration: '1m', target: 20  },
    { duration: '1m', target: 50  },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    // continua até a taxa de erro disparar
  ],
  thresholds: {
    http_req_failed: [
      { threshold: 'rate<0.05', abortOnFail: true },
    ],
  },
};
```

---

## 5. Organização com Groups e Tags

Use `group()` para organizar fluxos lógicos e `tags` para filtrar métricas por endpoint.

```javascript
import { group } from 'k6';

export default function () {
  group('autenticação', function () {
    const login = http.post('https://example.com/login', { user: 'test', pass: '123' });
    check(login, { 'login ok': (r) => r.status === 200 });
  });

  group('navegação', function () {
    http.get('https://example.com/dashboard');
    http.get('https://example.com/profile');
  });
}
```

---

## 6. Métricas importantes para análise

| Métrica | O que significa |
|---|---|
| `http_req_duration` | Tempo total da requisição |
| `http_req_failed` | Taxa de requisições com erro |
| `http_req_waiting` | Tempo até o primeiro byte (TTFB) |
| `http_req_connecting` | Tempo de conexão TCP |
| `http_req_tls_handshaking` | Tempo de handshake TLS |
| `checks_succeeded` | Taxa de checks aprovados |
| `iteration_duration` | Tempo de uma iteração completa |
| `vus` | Número de usuários virtuais ativos |

### Percentis recomendados para análise

- `p(50)` — mediana (50% das requisições)
- `p(90)` — ponto de referência comum para SLOs
- `p(95)` — threshold mais usado em produção
- `p(99)` — pior cenário realista
- `p(99.9)` — casos extremos

---

## 7. Boas práticas gerais

- **Sempre use `sleep()`** para simular o comportamento real do usuário e evitar flood artificial
- **Defina thresholds** em todo teste que vai para CI/CD
- **Comece com smoke test** antes de qualquer teste de carga
- **Use tags** para isolar métricas por endpoint ou tipo de requisição
- **Evite dados hardcoded** — use variáveis de ambiente com `__ENV.VARIAVEL`
- **Não armazene segredos nos scripts** — use `--env` na linha de comando ou arquivos `.env`
- **Valide o script antes de rodar** com `k6 run --vus 1 --iterations 1 script.js`

### Variáveis de ambiente

```javascript
const BASE_URL = __ENV.BASE_URL || 'https://quickpizza.grafana.com';

export default function () {
  http.get(`${BASE_URL}/api/pizza`);
}
```

Execução:
```bash
k6 run --env BASE_URL=https://staging.example.com script.js
```

---

## 8. Variáveis de ambiente (ENV)

### Formas de passar variáveis

**Via flag `--env` na linha de comando:**
```bash
k6 run --env BASE_URL=https://staging.example.com --env TOKEN=abc123 script.js
```

**Via arquivo `.env` com a flag `-e` (requer exportação manual):**
```bash
export $(cat .env | xargs) && k6 run script.js
```

**Via `--config` com arquivo de opções JSON:**
```bash
k6 run --config options.json script.js
```

### Acessando no script

```javascript
// Leitura com valor padrão (fallback)
const BASE_URL  = __ENV.BASE_URL  || 'https://quickpizza.grafana.com';
const TOKEN     = __ENV.TOKEN     || '';
const VUS       = parseInt(__ENV.VUS) || 10;
const DURATION  = __ENV.DURATION  || '30s';

export const options = {
  vus:      VUS,
  duration: DURATION,
};

export default function () {
  const res = http.get(`${BASE_URL}/api/pizza`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });

  check(res, { 'status 200': (r) => r.status === 200 });
}
```

### Ambientes dinâmicos (dev / staging / prod)

```javascript
const AMBIENTES = {
  dev:     'https://dev.example.com',
  staging: 'https://staging.example.com',
  prod:    'https://example.com',
};

const ENV     = __ENV.AMBIENTE || 'staging';
const BASE_URL = AMBIENTES[ENV];

if (!BASE_URL) {
  throw new Error(`Ambiente inválido: ${ENV}. Use dev, staging ou prod.`);
}
```

Execução:
```bash
k6 run --env AMBIENTE=prod script.js
```

### Boas práticas de segurança com ENVs

- **Nunca** commite tokens, senhas ou API keys no script
- Use `--env TOKEN=$TOKEN` referenciando variáveis do shell, não valores literais
- Em CI/CD (GitHub Actions, GitLab CI), use **secrets** da plataforma:
  ```yaml
  # GitHub Actions
  - run: k6 run script.js
    env:
      BASE_URL: ${{ vars.BASE_URL }}
      TOKEN:    ${{ secrets.API_TOKEN }}
  ```
- Adicione `.env` ao `.gitignore` para não vazar credenciais

### Exemplo de `.env` local (não versionar)

```bash
# .env — NÃO commitar!
BASE_URL=https://staging.example.com
TOKEN=meu-token-secreto
VUS=20
DURATION=1m
```

---

## 9. Web Dashboard e relatório HTML

### Por que não usar como padrão

O web dashboard é ideal para análise visual durante o desenvolvimento e apresentações, mas **não deve ser o modo padrão** porque:

- Consome mais memória e CPU durante o teste
- Em CI/CD pipelines não há interface para visualizar
- Gera arquivos HTML que precisam ser gerenciados
- Pode mascarar problemas de performance do próprio runner

**Recomendação:** use no modo padrão (sem dashboard) em automações e pipelines. Reserve o dashboard para análise exploratória e demonstrações.

### Executar com dashboard ao vivo

Abre o dashboard em `http://localhost:5665` durante a execução:

```bash
K6_WEB_DASHBOARD=true k6 run tests/quickpizza.js
```

### Executar com dashboard + exportar relatório HTML

```bash
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=reports/report.html k6 run tests/quickpizza.js
```

### Configurações disponíveis

| Variável | Padrão | Descrição |
|---|---|---|
| `K6_WEB_DASHBOARD` | `false` | Ativa o dashboard |
| `K6_WEB_DASHBOARD_HOST` | `localhost` | Host do servidor |
| `K6_WEB_DASHBOARD_PORT` | `5665` | Porta do servidor |
| `K6_WEB_DASHBOARD_OPEN` | `false` | Abre o browser automaticamente |
| `K6_WEB_DASHBOARD_EXPORT` | — | Caminho do arquivo HTML exportado |
| `K6_WEB_DASHBOARD_PERIOD` | `10s` | Intervalo de atualização |

### Usando o script auxiliar `run.sh`

Use o script `run.sh` na raiz do projeto para não precisar lembrar os comandos:

```bash
# Execução padrão (sem dashboard)
./run.sh tests/quickpizza.js

# Com dashboard ao vivo
./run.sh tests/quickpizza.js --dashboard

# Com dashboard + exportar relatório
./run.sh tests/quickpizza.js --report
```

---

## 10. Referências

- [Documentação oficial k6](https://grafana.com/docs/k6/latest/)
- [Checks](https://grafana.com/docs/k6/latest/using-k6/checks/)
- [Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [Tipos de teste](https://grafana.com/docs/k6/latest/testing-guides/test-types/)
- [Métricas built-in](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/)
- [Repositório mcp-k6](https://github.com/grafana/mcp-k6)
- [Web Dashboard](https://grafana.com/docs/k6/latest/results-output/web-dashboard/)
