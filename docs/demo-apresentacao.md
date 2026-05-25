# Demo — Cenários de Teste com k6 + MCP

Roteiro de prompts prontos para usar durante a apresentação.
Cole direto no chat do VS Code com o agente `@k6 Engineer` ativo.

**Alvo de todos os cenários:** `https://quickpizza.grafana.com`

---

## Antes de começar

Verificar que o MCP está ativo:
> O servidor k6 MCP está disponível? Liste as ferramentas disponíveis.

---

## Cenário 1 — Smoke Test
> *"Será que está no ar?"*

```
@k6 Engineer Faz um smoke test em https://quickpizza.grafana.com
com 1 VU por 30 segundos.
Valida e executa. Me diz se está respondendo 200 e se o tempo de resposta está abaixo de 1 segundo.
```

**O que observar:** validação em 1 iteração → execução → resultado dos checks.

---

## Cenário 2 — Load Test
> *"Aguenta o uso normal?"*

```
@k6 Engineer Cria e executa um load test em https://quickpizza.grafana.com.
Simula 10 usuários simultâneos por 1 minuto.
Threshold: p95 < 500ms e taxa de erro < 1%.
Abre o dashboard para eu acompanhar ao vivo.
```

**O que observar:** ramp-up gradual, estabilização dos VUs, p95 ao longo do tempo no dashboard.

---

## Cenário 3 — Stress Test
> *"Qual o limite antes de degradar?"*

```
@k6 Engineer Cria um stress test em https://quickpizza.grafana.com.
Sobe de 5 para 30 VUs em 3 etapas ao longo de 2 minutos.
Threshold: p95 < 2000ms e taxa de erro < 5%.
Valida, executa e me mostra onde começa a degradar.
```

**O que observar:** ponto onde a latência começa a subir com os VUs, se threshold falha.

---

## Cenário 4 — Spike Test
> *"E se der uma Black Friday?"*

```
@k6 Engineer Simula um pico repentino em https://quickpizza.grafana.com.
Começa com 1 VU, sobe para 25 VUs em 10 segundos, mantém por 30 segundos e volta a 1.
Threshold: p95 < 1500ms e taxa de erro < 5%.
Quero ver se o sistema se recupera depois do pico.
```

**O que observar:** comportamento durante o pico e tempo de recuperação após a queda.

---

## Cenário 5 — Breakpoint
> *"Até onde vai antes de quebrar?"*

```
@k6 Engineer Faz um breakpoint test em https://quickpizza.grafana.com.
Começa com 5 VUs e adiciona 5 a cada 30 segundos.
Abort automático quando a taxa de erro passar de 10%.
Me diz em quantos VUs o sistema começou a falhar.
```

**O que observar:** o k6 para sozinho quando o sistema cede — o agente informa o ponto de ruptura.

---

## Cenário 6 — Loop autônomo com iteração
> *"Ajusta até passar nos thresholds"*

```
@k6 Engineer Cria um load test para https://quickpizza.grafana.com/api/pizza.
10 VUs por 30 segundos.
Critérios: p95 < 300ms e taxa de erro < 1%.
Se não passar, ajusta os stages e tenta de novo até passar ou chegar em 3 tentativas.
```

**O que observar:** o agente iterando automaticamente — ajuste de stages sem intervenção humana.

---

## Dica: abrir o dashboard manualmente

Se quiser acompanhar qualquer teste ao vivo pelo browser:

```bash
./run.sh tests/<script>.js --dashboard
```

Dashboard disponível em: **http://localhost:5665**
