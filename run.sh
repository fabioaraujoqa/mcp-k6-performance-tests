#!/usr/bin/env bash
# run.sh — Script auxiliar para execução de testes k6
#
# Uso:
#   ./run.sh <script>              → execução padrão (sem dashboard)
#   ./run.sh <script> --dashboard  → dashboard ao vivo em http://localhost:5665
#   ./run.sh <script> --report     → dashboard + exporta reports/report.html

set -euo pipefail

SCRIPT="${1:-}"
MODE="${2:-}"

if [[ -z "$SCRIPT" ]]; then
  echo "Uso: ./run.sh <script> [--dashboard|--report]"
  echo ""
  echo "  ./run.sh tests/quickpizza.js"
  echo "  ./run.sh tests/quickpizza.js --dashboard"
  echo "  ./run.sh tests/quickpizza.js --report"
  exit 1
fi

# Carrega .env se existir
if [[ -f .env ]]; then
  set -o allexport
  source .env
  set +o allexport
fi

# Garante que a pasta de relatórios existe
mkdir -p reports

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="reports/report_${TIMESTAMP}.html"

case "$MODE" in
  --dashboard)
    echo "▶ Rodando com web dashboard (abrindo browser em http://localhost:5665)"
    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=true k6 run "$SCRIPT"
    ;;
  --report)
    echo "▶ Rodando com web dashboard + exportando relatório: $REPORT_FILE"
    K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_OPEN=true K6_WEB_DASHBOARD_EXPORT="$REPORT_FILE" k6 run "$SCRIPT"
    echo "✔ Relatório salvo em: $REPORT_FILE"
    ;;
  *)
    echo "▶ Rodando sem dashboard"
    k6 run "$SCRIPT"
    ;;
esac
