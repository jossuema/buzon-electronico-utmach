#!/usr/bin/env bash
#
# Configura los Secrets y Variables del repositorio en GitHub para el workflow
# de despliegue a Azure. Usa el GitHub CLI (gh). No toca la consola web.
#
# Requisitos: `gh auth login` y haber ejecutado antes ./scripts/azure-provision.sh
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

REPO="${REPO_SLUG:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "▶ Repositorio: $REPO"

echo "▶ Secrets (OIDC)"
gh secret set AZURE_CLIENT_ID --repo "$REPO" --body "$CLIENT_ID"
gh secret set AZURE_TENANT_ID --repo "$REPO" --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --repo "$REPO" --body "$SUBSCRIPTION_ID"

echo "▶ Variables"
gh variable set AZURE_ACR_NAME --repo "$REPO" --body "$ACR"
gh variable set AZURE_WEBAPP_NAME --repo "$REPO" --body "$APP"
gh variable set AZURE_RESOURCE_GROUP --repo "$REPO" --body "$RG"

echo "▶ Environment 'production'"
gh api -X PUT "repos/$REPO/environments/production" >/dev/null

cat <<EOF

✅ GitHub configurado.
   Para desplegar:  git push origin main   (dispara .github/workflows/azure-deploy.yml)
   O manualmente:   gh workflow run "Deploy to Azure"
EOF
