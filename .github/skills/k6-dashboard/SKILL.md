---
name: k6-dashboard
description: 'Use when opening the k6 web dashboard, viewing live metrics, generating HTML reports, or configuring dashboard env vars. Covers K6_WEB_DASHBOARD_OPEN, K6_WEB_DASHBOARD_EXPORT and all run.sh dashboard flags.'
---

# k6 Web Dashboard

Use esta skill quando o usuário pedir para abrir o dashboard, visualizar métricas em tempo real, ou gerar relatório HTML de um teste k6.

## Como ativar o dashboard

O dashboard é um recurso **built-in do k6** — nenhuma extensão necessária.

### Via run.sh (recomendado)

```bash
# Abre o browser automaticamente + dashboard ao vivo
./run.sh tests/script.js --dashboard

# Abre o browser + salva relatório HTML ao final
./run.sh tests/script.js --report
```

### Diretamente com k6

```bash
# Dashboard + abre browser automaticamente
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=true k6 run tests/script.js

# Dashboard + abre browser + exporta relatório HTML
K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=true K6_WEB_DASHBOARD_EXPORT=reports/report.html k6 run tests/script.js
```

## Variáveis de ambiente disponíveis

| Variável                  | Descrição                                              | Padrão      |
|---------------------------|--------------------------------------------------------|-------------|
| `K6_WEB_DASHBOARD`        | Habilita o dashboard                                   | `false`     |
| `K6_WEB_DASHBOARD_OPEN`   | Abre o browser automaticamente ao iniciar o teste      | `false`     |
| `K6_WEB_DASHBOARD_HOST`   | Host onde o dashboard será servido                     | `localhost` |
| `K6_WEB_DASHBOARD_PORT`   | Porta do dashboard                                     | `5665`      |
| `K6_WEB_DASHBOARD_PERIOD` | Período de atualização dos gráficos                    | `10s`       |
| `K6_WEB_DASHBOARD_EXPORT` | Caminho do arquivo HTML para exportar ao final do teste | `""` (desabilitado) |

## Regras importantes

- **SEMPRE use `K6_WEB_DASHBOARD_OPEN=true`** junto com `K6_WEB_DASHBOARD=true` — sem isso, o browser não abre automaticamente
- Os gráficos do relatório HTML só aparecem se o teste durar **mais de 3× o período de agregação** (`K6_WEB_DASHBOARD_PERIOD`, padrão 10s → mínimo ~30s de teste)
- Em CI/CD, use `K6_WEB_DASHBOARD_PORT=-1` para desabilitar o servidor HTTP e não bloquear o processo
- O k6 mantém o processo vivo enquanto houver uma janela do browser aberta — feche o browser para encerrar

## Comportamento do run.sh

O `run.sh` já configura tudo automaticamente:

```
./run.sh tests/script.js --dashboard  → K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=true
./run.sh tests/script.js --report     → + K6_WEB_DASHBOARD_EXPORT=reports/report_TIMESTAMP.html
```

## Quando usar cada modo

| Situação                         | Comando                               |
|----------------------------------|---------------------------------------|
| Monitoramento ao vivo            | `./run.sh tests/script.js --dashboard` |
| Demonstração / apresentação      | `./run.sh tests/script.js --dashboard` |
| Compartilhar resultado com time  | `./run.sh tests/script.js --report`   |
| CI/CD sem dashboard              | `./run.sh tests/script.js`            |
| Debug rápido / smoke test        | MCP `run_script` (sem dashboard)      |
