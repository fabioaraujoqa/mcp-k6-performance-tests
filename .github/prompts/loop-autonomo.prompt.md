---
description: "Run the full autonomous k6 loop: generate script → validate → execute → analyze → iterate until thresholds pass"
argument-hint: "URL, tipo de teste e critérios de aceite (ex: p95 < 500ms, error rate < 1%)"
agent: "agent"
tools: [read, edit, k6/*]
---

Execute o loop autônomo completo de teste de performance com k6.

**Entrada esperada:** URL alvo + tipo de teste + critérios de aceite (thresholds desejados).

## Loop obrigatório

```
1. Gerar script → 2. validate_script → 3. run_script → 4. Analisar → 5. Iterar se necessário
```

### Passo 1 — Gerar o script

- Crie o script em `tests/<tipo>-<alvo>.js`
- Inclua os thresholds informados pelo usuário (ou use os padrões: p95 < 500ms, error rate < 1%)
- Use `__ENV.BASE_URL || '<url-fornecida>'`
- Aplique `sleep(1)` e `checks` obrigatórios

### Passo 2 — Validar

- Execute `validate_script` antes de qualquer coisa
- Se houver erro de sintaxe ou de execução, corrija o script e revalide
- Só avance quando a validação passar

### Passo 3 — Executar

- Execute `run_script` com o script validado
- Capture todas as métricas retornadas

### Passo 4 — Analisar resultados

Avalie:
- Thresholds passaram ou falharam?
- Qual métrica está fora do esperado (`p95`, `error rate`, `checks`)?
- Há padrão de degradação com o aumento de VUs?

### Passo 5 — Iterar (se necessário)

Se os thresholds **falharam**:
1. Identifique a causa (VUs altos demais, sleep curto, endpoint lento)
2. Ajuste o script (stages mais suaves, thresholds mais realistas, ou reporte o problema ao usuário)
3. Volte ao Passo 2 (revalidar antes de reexecutar)

**Máximo de 3 iterações automáticas.** Se após 3 tentativas os thresholds ainda falham, reporte ao usuário com diagnóstico detalhado.

## Guardrails

- Nunca execute `run_script` sem `validate_script` ter passado antes
- Se a URL for de produção, pause e confirme com o usuário
- Scripts com VUs > 500 requerem confirmação explícita
- Não ajuste thresholds para cima apenas para forçar o teste a passar — isso mascara problemas reais

## Saída esperada ao final

```
## Resultado final: ✅ Passou / ❌ Falhou após N iterações

**Script:** tests/<nome>.js
**Iterações realizadas:** N

### Métricas finais
- p95: Xms (threshold: <Yms)
- Error rate: X% (threshold: <Y%)
- Checks: X%

### Ajustes realizados
...

### Diagnóstico
...
```
