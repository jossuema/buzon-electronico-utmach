#!/usr/bin/env bash
#
# Provisiona TODA la infraestructura de Azure para el Buzón Inteligente UTMACH.
# Idempotente y resiliente: persiste el estado temprano en scripts/.azure-env y
# no aborta si falla la parte de OIDC (la infraestructura igual queda lista).
#
# Requisitos: estar autenticado con `az login`.
#
set -uo pipefail
cd "$(dirname "$0")/.."

ENV_FILE="scripts/.azure-env"
# shellcheck disable=SC1090
[ -f "$ENV_FILE" ] && source "$ENV_FILE"

# --- Configuración (override con variables de entorno si quieres) ---
LOCATION="${LOCATION:-eastus2}"
RG="${RG:-rg-buzon-utmach}"
SUFFIX="${SUFFIX:-$(openssl rand -hex 3)}"
ACR="${ACR:-acrbuzon${SUFFIX}}"
PLAN="${PLAN:-plan-buzon-utmach}"
APP="${APP:-buzon-utmach-${SUFFIX}}"
PG="${PG:-pg-buzon-${SUFFIX}}"
PG_ADMIN="${PG_ADMIN:-buzonadmin}"
DB_NAME="${DB_NAME:-buzon_utmach}"
PG_PASSWORD="${PG_PASSWORD:-$(openssl rand -hex 16)Aa9-}"
AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -base64 32)}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@utmachala.edu.ec}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Buzon-$(openssl rand -hex 4)*2026}"
IMAGE_NAME="buzon-utmach"
CLIENT_ID="${CLIENT_ID:-}"

REPO_SLUG="${REPO_SLUG:-$(git config --get remote.origin.url | sed -E 's#(git@|https://)github.com[:/]##; s/\.git$//')}"

SUBSCRIPTION_ID="$(az account show --query id -o tsv)"
TENANT_ID="$(az account show --query tenantId -o tsv)"
DATABASE_URL="postgresql://${PG_ADMIN}:${PG_PASSWORD}@${PG}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"

write_env() {
  cat > "$ENV_FILE" <<EOF
# Generado por azure-provision.sh — NO subir a git (contiene secretos)
LOCATION=$LOCATION
RG=$RG
SUFFIX=$SUFFIX
ACR=$ACR
PLAN=$PLAN
APP=$APP
PG=$PG
PG_ADMIN=$PG_ADMIN
PG_PASSWORD=$PG_PASSWORD
DB_NAME=$DB_NAME
DATABASE_URL=$DATABASE_URL
AUTH_SECRET=$AUTH_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
SUBSCRIPTION_ID=$SUBSCRIPTION_ID
TENANT_ID=$TENANT_ID
CLIENT_ID=$CLIENT_ID
REPO_SLUG=$REPO_SLUG
IMAGE_NAME=$IMAGE_NAME
EOF
}
# Persistencia temprana (idempotencia ante fallos)
write_env
echo "▶ Estado guardado en $ENV_FILE (SUFFIX=$SUFFIX)"

set -e

echo "▶ Grupo de recursos $RG"
az group create --name "$RG" --location "$LOCATION" -o none

echo "▶ Azure Container Registry $ACR"
az acr show -n "$ACR" -g "$RG" >/dev/null 2>&1 || \
  az acr create -g "$RG" -n "$ACR" --sku Basic -o none

echo "▶ PostgreSQL Flexible Server $PG (puede tardar varios minutos)"
if ! az postgres flexible-server show -g "$RG" -n "$PG" >/dev/null 2>&1; then
  az postgres flexible-server create \
    --resource-group "$RG" --name "$PG" --location "$LOCATION" \
    --admin-user "$PG_ADMIN" --admin-password "$PG_PASSWORD" \
    --sku-name Standard_B1ms --tier Burstable --version 16 \
    --storage-size 32 --public-access 0.0.0.0 --yes -o none
fi
az postgres flexible-server db show -g "$RG" -s "$PG" -d "$DB_NAME" >/dev/null 2>&1 || \
  az postgres flexible-server db create -g "$RG" -s "$PG" -d "$DB_NAME" -o none

echo "▶ App Service Plan $PLAN (Linux)"
az appservice plan show -g "$RG" -n "$PLAN" >/dev/null 2>&1 || \
  az appservice plan create -g "$RG" -n "$PLAN" --is-linux --sku B1 -o none

echo "▶ Web App $APP (contenedor)"
az webapp show -g "$RG" -n "$APP" >/dev/null 2>&1 || \
  az webapp create -g "$RG" -p "$PLAN" -n "$APP" \
    --deployment-container-image-name "mcr.microsoft.com/azuredocs/aci-helloworld" -o none

echo "▶ Variables de entorno de la Web App"
az webapp config appsettings set -g "$RG" -n "$APP" -o none --settings \
  DATABASE_URL="$DATABASE_URL" \
  AUTH_SECRET="$AUTH_SECRET" \
  AUTH_URL="https://${APP}.azurewebsites.net" \
  AUTH_TRUST_HOST="true" \
  ADMIN_EMAIL="$ADMIN_EMAIL" \
  ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  WEBSITES_PORT="3000"

echo "▶ Identidad administrada + permiso AcrPull"
az webapp identity assign -g "$RG" -n "$APP" -o none
PRINCIPAL_ID="$(az webapp identity show -g "$RG" -n "$APP" --query principalId -o tsv)"
ACR_ID="$(az acr show -g "$RG" -n "$ACR" --query id -o tsv)"
az role assignment create --assignee "$PRINCIPAL_ID" --role AcrPull --scope "$ACR_ID" -o none 2>/dev/null || true
az resource update --ids "$(az webapp show -g "$RG" -n "$APP" --query id -o tsv)/config/web" \
  --set properties.acrUseManagedIdentityCreds=true -o none

# --- OIDC para GitHub Actions (no fatal si faltan permisos de Entra ID) ---
setup_oidc() {
  echo "▶ App de Entra ID + OIDC para GitHub ($REPO_SLUG)"
  local APP_DISPLAY="github-buzon-utmach"
  CLIENT_ID="$(az ad app list --display-name "$APP_DISPLAY" --query "[0].appId" -o tsv 2>/dev/null)"
  if [ -z "$CLIENT_ID" ]; then
    CLIENT_ID="$(az ad app create --display-name "$APP_DISPLAY" --query appId -o tsv)"
  fi
  az ad sp show --id "$CLIENT_ID" >/dev/null 2>&1 || az ad sp create --id "$CLIENT_ID" -o none
  az role assignment create --assignee "$CLIENT_ID" --role Contributor \
    --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RG}" -o none 2>/dev/null || true

  add_federated() {
    local name="$1" subject="$2"
    az ad app federated-credential show --id "$CLIENT_ID" --federated-credential-id "$name" >/dev/null 2>&1 && return 0
    az ad app federated-credential create --id "$CLIENT_ID" --parameters "{
      \"name\": \"$name\",
      \"issuer\": \"https://token.actions.githubusercontent.com\",
      \"subject\": \"$subject\",
      \"audiences\": [\"api://AzureADTokenExchange\"]
    }" -o none
  }
  add_federated "github-main" "repo:${REPO_SLUG}:ref:refs/heads/main"
  add_federated "github-env-production" "repo:${REPO_SLUG}:environment:production"
}

if setup_oidc; then
  OIDC_OK=1
  echo "✓ OIDC configurado (CLIENT_ID=$CLIENT_ID)"
else
  OIDC_OK=0
  echo "⚠ No se pudo configurar OIDC (¿permisos de Entra ID?). La infraestructura está lista; el despliegue continuo por GitHub Actions quedará pendiente."
fi

write_env

cat <<EOF

✅ Infraestructura lista.
   App URL (tras el primer deploy): https://${APP}.azurewebsites.net
   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}
   OIDC para GitHub Actions: $([ "${OIDC_OK:-0}" = "1" ] && echo "OK" || echo "PENDIENTE")
EOF
