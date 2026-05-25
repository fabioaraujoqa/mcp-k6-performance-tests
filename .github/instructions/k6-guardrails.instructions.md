---
description: "Use when creating or reviewing k6 tests to apply safety guardrails. Covers credential safety, VU limits, production protection, validate-before-run, and CI/CD best practices."
---

# Guardrails de segurança para testes k6

## 1. Proteção de credenciais

**NUNCA** inclua credenciais, tokens ou senhas diretamente no script:

```javascript
// ❌ ERRADO — expõe credencial no código
const TOKEN = 'ghp_abc123xyz';

// ✅ CORRETO — lê de variável de ambiente
const TOKEN = __ENV.TOKEN || '';
```

Se detectar um valor que pareça token, senha ou chave de API hardcoded, reescreva usando `__ENV`.

## 2. Limites de VUs e duração

Antes de criar ou executar um teste com VUs altos ou longa duração, avise o usuário:

| Faixa de VUs | Ação |
|---|---|
| 1 – 100 | Normal, sem aviso |
| 101 – 500 | Avise que pode causar carga significativa |
| 500+ | Exija confirmação explícita do usuário |

Para testes de Soak (>30 min) ou Breakpoint (sem limite de VUs com `abortOnFail`), sempre pergunte se o ambiente alvo suporta a carga.

## 3. Proteção de ambiente de produção

Se `BASE_URL` ou qualquer URL no script apontar para produção (sem `dev.`, `staging.`, `sandbox.`, `test.`), alerte:

> ⚠️ O endpoint parece ser de produção. Confirme antes de executar testes de carga.

Em scripts com stages agressivos (Stress / Breakpoint), adicione comentário de aviso:

```javascript
// ⚠️ ATENÇÃO: Não execute contra produção sem aprovação
```

## 4. Validação obrigatória antes de executar

**Nunca** execute `run_script` sem antes executar `validate_script`.

Fluxo obrigatório:
1. `validate_script` com 1 VU / 1 iteração
2. Confirmar que não há erros
3. Só então `run_script`

Se o usuário pedir para "rodar o teste" diretamente, execute a validação primeiro e informe.

## 5. CI/CD — boas práticas

Em pipelines de CI/CD, sempre:
- Use `thresholds` para que o k6 retorne exit code não-zero em caso de falha
- Nunca commite `.env` — use secrets da plataforma (GitHub Actions Secrets, GitLab CI Variables)
- Prefira `--env VAR=${{ secrets.VAR }}` em vez de arquivos `.env` no runner

```yaml
# GitHub Actions — exemplo correto
- run: k6 run tests/load-api.js
  env:
    BASE_URL: ${{ vars.BASE_URL }}
    TOKEN:    ${{ secrets.API_TOKEN }}
```

## 6. Relatórios

- Relatórios HTML ficam em `reports/` (gitignored)
- Use o helper `./run.sh tests/script.js --report` para gerar com timestamp automático
- Não commite relatórios — eles podem conter dados sensíveis da resposta HTTP

## 7. Checklist antes de PR

Antes de commitar um script novo, verifique:

- [ ] Sem credenciais hardcoded
- [ ] `thresholds` definidos
- [ ] `checks` em todas as requisições principais
- [ ] `sleep()` presente
- [ ] `BASE_URL` via `__ENV`
- [ ] Nome do arquivo segue a convenção `<tipo>-<alvo>.js`
- [ ] Script validado com `validate_script` ou `k6 run --vus 1 --iterations 1`
