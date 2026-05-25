---
description: "Analyze k6 test results and provide actionable insights about performance, thresholds, and bottlenecks"
argument-hint: "Cole os resultados do k6 ou descreva o cenário"
agent: "agent"
tools: [read, k6/*]
---

Analise os resultados do teste k6 fornecidos e produza um relatório estruturado.

## O que analisar

### 1. Thresholds

- Quais thresholds passaram? Quais falharam?
- Se algum falhou, qual foi o valor obtido vs. o esperado?

### 2. Métricas principais

Avalie as seguintes métricas quando presentes:

| Métrica | Referência |
|---|---|
| `http_req_duration` p(95) | Deve estar abaixo do threshold configurado |
| `http_req_failed` | < 1% é saudável; > 5% é crítico |
| `http_req_waiting` | TTFB alto indica lentidão no servidor |
| `iteration_duration` | Tempo total de uma iteração incluindo sleep |
| `checks` rate | > 95% aceitável; < 90% preocupante |

### 3. Padrões de degradação

Identifique se há:
- Aumento progressivo de latência com o crescimento de VUs (indica saturação)
- Erros concentrados em algum endpoint específico
- Pico de erros no início (conexão) vs. durante o teste (processamento)

### 4. Recomendações

Baseado nos resultados, sugira:
- Ajuste de thresholds se estiverem muito conservadores ou muito lenientes
- Mudanças nos stages (ramp-up mais lento, menos VUs máximos)
- Endpoints que precisam de otimização no backend
- Se o resultado justifica um teste mais pesado (stress / soak) ou se o sistema falhou

## Formato do relatório

```
## Resumo

**Resultado:** ✅ Passou / ❌ Falhou

## Thresholds
...

## Métricas Destacadas
...

## Diagnóstico
...

## Próximos passos
...
```
