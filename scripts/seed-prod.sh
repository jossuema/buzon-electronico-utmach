#!/usr/bin/env bash
#
# Siembra los datos de la UTMACH en la base de datos de producción (Azure).
# Abre temporalmente el firewall de PostgreSQL para la IP de esta máquina,
# ejecuta el seed y vuelve a cerrar la regla.
#
# Requisitos: `az login` y haber ejecutado ./scripts/azure-provision.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="scripts/.azure-env"
if [ ! -f "$ENV_FILE" ]; then
  echo "✖ No existe $ENV_FILE. Ejecuta primero ./scripts/azure-provision.sh" >&2
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

MYIP="$(curl -s https://api.ipify.org)"
echo "▶ Abriendo firewall temporal para $MYIP"
az postgres flexible-server firewall-rule create -g "$RG" -n "$PG" \
  --rule-name seed-temp --start-ip-address "$MYIP" --end-ip-address "$MYIP" -o none

cleanup() {
  echo "▶ Cerrando firewall temporal"
  az postgres flexible-server firewall-rule delete -g "$RG" -n "$PG" \
    --rule-name seed-temp --yes -o none || true
}
trap cleanup EXIT

echo "▶ Ejecutando seed contra producción"
DATABASE_URL="$DATABASE_URL" npm run db:seed

echo "✅ Seed de producción completado."
