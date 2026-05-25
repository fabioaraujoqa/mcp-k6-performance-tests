---
description: "Create a new k6 test script from scratch for a given URL and test type"
argument-hint: "URL e tipo de teste (smoke/load/stress/spike/soak/breakpoint)"
agent: "agent"
tools: [read, edit, k6/*]
---

Crie um script k6 novo em `tests/` seguindo os padrões do projeto.

**Entrada esperada:** URL alvo + tipo de teste (smoke / load / stress / spike / soak / breakpoint).

## Passos obrigatórios

1. Determine o tipo de teste e escolha a configuração de `stages` adequada conforme [docs/boas-praticas.md](../../docs/boas-praticas.md)
2. Crie o arquivo em `tests/<tipo>-<alvo>.js` seguindo as convenções de nomenclatura
3. O script **deve** conter:
   - `export const options` com `thresholds` e `stages` (ou `vus`/`duration` para smoke)
   - `checks` validando status HTTP e tempo de resposta
   - `sleep()` entre iterações
   - URL via `__ENV.BASE_URL || '<url-fornecida>'` 
4. Após criar o arquivo, execute `validate_script` para confirmar que está correto
5. Reporte o resultado da validação e pergunte se o usuário quer executar o teste completo

## Templates de referência por tipo

Consulte [docs/boas-praticas.md](../../docs/boas-praticas.md) seção "4. Tipos de teste e configuração de stages" para os templates corretos de cada tipo.

## Guardrails

- Se a URL parecer ser de produção, avise o usuário antes de criar o script
- Nunca inclua credenciais literais no código — use `__ENV`
- Scripts com VUs > 500 exigem confirmação explícita
