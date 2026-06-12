# Despliegue en Azure con CI/CD (GitHub Actions)

Esta guía deja el **Buzón Inteligente UTMACH** desplegado en Azure con
integración y despliegue continuos desde GitHub.

---

## ⚡ Vía automatizada (recomendada, sin tocar consolas web)

Todo se hace por terminal con `az` y `gh`. Solo necesitas autenticarte una vez:

```bash
# 1) Autenticación (única intervención manual, en terminal)
az login
gh auth login

# 2) Provisionar TODA la infraestructura en Azure (RG, ACR, PostgreSQL,
#    App Service, identidad y OIDC para GitHub). Idempotente.
./scripts/azure-provision.sh

# 3) Configurar Secrets y Variables del repo en GitHub
./scripts/github-setup.sh

# 4) Desplegar (dispara el workflow azure-deploy.yml)
git push origin main

# 5) Sembrar los datos de la UTMACH en la base de datos de producción
./scripts/seed-prod.sh
```

Los nombres y secretos generados se guardan en `scripts/.azure-env`
(ignorado por git). Para eliminar todo: `az group delete --name rg-buzon-utmach --yes`.

El resto de este documento explica **manualmente** lo que hacen esos scripts,
por si quieres entender o personalizar cada paso.

---

## Arquitectura de despliegue

```
GitHub (push a main)
   │
   ├─ Workflow CI (.github/workflows/ci.yml) ........ lint + build en cada push/PR
   │
   └─ Workflow CD (.github/workflows/azure-deploy.yml)
         │  login OIDC
         ▼
   Azure Container Registry (ACR) ── az acr build ──► imagen Docker
         │
         ▼
   Azure App Service (Web App for Containers, Linux)
         │  (al iniciar el contenedor: prisma migrate deploy)
         ▼
   Azure Database for PostgreSQL – Flexible Server
```

### Servicios Azure utilizados

| Servicio | Para qué | SKU sugerido (económico) |
|---|---|---|
| **Azure Database for PostgreSQL – Flexible Server** | Base de datos gestionada | `Standard_B1ms` (Burstable) |
| **Azure Container Registry (ACR)** | Almacena la imagen Docker | `Basic` |
| **Azure App Service Plan (Linux)** | Cómputo de la Web App | `B1` (Basic) |
| **Azure Web App for Containers** | Ejecuta el contenedor Next.js | — |

> Para una cuenta educativa / capa gratuita puedes usar `F1` en el plan, pero
> los contenedores requieren al menos `B1`.

---

## 1. Prerrequisitos

- Una suscripción de Azure.
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) instalado y `az login`.
- El repositorio en GitHub.

Define variables locales (ajústalas a tu gusto):

```bash
export RG="rg-buzon-utmach"
export LOCATION="eastus2"
export ACR="acrbuzonutmach$RANDOM"      # debe ser único globalmente
export PLAN="plan-buzon-utmach"
export APP="buzon-utmach-$RANDOM"        # debe ser único globalmente (xxx.azurewebsites.net)
export PG="pg-buzon-utmach-$RANDOM"      # debe ser único globalmente
export PG_ADMIN="buzonadmin"
export PG_PASSWORD="$(openssl rand -base64 18)"
export DB_NAME="buzon_utmach"
```

---

## 2. Crear la infraestructura

```bash
# Grupo de recursos
az group create --name "$RG" --location "$LOCATION"

# Azure Container Registry
az acr create --resource-group "$RG" --name "$ACR" --sku Basic

# PostgreSQL Flexible Server + base de datos
az postgres flexible-server create \
  --resource-group "$RG" \
  --name "$PG" \
  --location "$LOCATION" \
  --admin-user "$PG_ADMIN" \
  --admin-password "$PG_PASSWORD" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0   # permite que servicios de Azure se conecten

az postgres flexible-server db create \
  --resource-group "$RG" \
  --server-name "$PG" \
  --database-name "$DB_NAME"

# Plan de App Service (Linux) + Web App para contenedores
az appservice plan create \
  --resource-group "$RG" \
  --name "$PLAN" \
  --is-linux \
  --sku B1

# Imagen inicial temporal (se reemplaza en el primer despliegue)
az webapp create \
  --resource-group "$RG" \
  --plan "$PLAN" \
  --name "$APP" \
  --deployment-container-image-name "mcr.microsoft.com/azuredocs/aci-helloworld"
```

---

## 3. Configurar la Web App

### Variables de entorno (App Settings)

```bash
DATABASE_URL="postgresql://$PG_ADMIN:$PG_PASSWORD@$PG.postgres.database.azure.com:5432/$DB_NAME?sslmode=require"

az webapp config appsettings set \
  --resource-group "$RG" \
  --name "$APP" \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    AUTH_SECRET="$(openssl rand -base64 32)" \
    AUTH_URL="https://$APP.azurewebsites.net" \
    AUTH_TRUST_HOST="true" \
    ADMIN_EMAIL="tu-correo-admin@example.com" \
    ADMIN_PASSWORD="$(openssl rand -base64 18)" \
    WEBSITES_PORT="3000"
```

> `WEBSITES_PORT=3000` le dice a App Service en qué puerto escucha el contenedor.
> `AUTH_TRUST_HOST=true` es necesario para Auth.js detrás del proxy de Azure.

### Permitir que la Web App lea del ACR (identidad administrada)

```bash
# Habilita identidad administrada en la Web App
az webapp identity assign --resource-group "$RG" --name "$APP"

# Concede a esa identidad el rol AcrPull sobre el registro
PRINCIPAL_ID=$(az webapp identity show -g "$RG" -n "$APP" --query principalId -o tsv)
ACR_ID=$(az acr show -g "$RG" -n "$ACR" --query id -o tsv)
az role assignment create --assignee "$PRINCIPAL_ID" --role AcrPull --scope "$ACR_ID"

# Indica a la Web App que use la identidad administrada para el pull
az resource update \
  --ids $(az webapp show -g "$RG" -n "$APP" --query id -o tsv)/config/web \
  --set properties.acrUseManagedIdentityCreds=true
```

---

## 4. Configurar OIDC para GitHub Actions

Crea una app de Microsoft Entra ID con credenciales federadas (sin secretos
de larga duración).

```bash
APP_ID=$(az ad app create --display-name "github-buzon-utmach" --query appId -o tsv)
az ad sp create --id "$APP_ID"

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

# Rol de colaborador sobre el grupo de recursos
az role assignment create \
  --assignee "$APP_ID" \
  --role Contributor \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG"

# Credencial federada para la rama main (ajusta ORG/REPO)
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:ORG/REPO:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

# Credencial adicional para el environment "production" (si usas environments)
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-env-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:ORG/REPO:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}'

echo "AZURE_CLIENT_ID=$APP_ID"
echo "AZURE_TENANT_ID=$TENANT_ID"
echo "AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID"
```

---

## 5. Configurar GitHub (Secrets y Variables)

En **Settings → Secrets and variables → Actions** del repositorio:

### Secrets (Repository secrets)
| Nombre | Valor |
|---|---|
| `AZURE_CLIENT_ID` | el `appId` del paso 4 |
| `AZURE_TENANT_ID` | tu tenant |
| `AZURE_SUBSCRIPTION_ID` | tu suscripción |

### Variables (Repository variables)
| Nombre | Valor |
|---|---|
| `AZURE_ACR_NAME` | el valor de `$ACR` |
| `AZURE_WEBAPP_NAME` | el valor de `$APP` |
| `AZURE_RESOURCE_GROUP` | el valor de `$RG` |

> El workflow usa el environment `production`. Créalo en
> **Settings → Environments** (puedes añadir aprobadores para los despliegues).

---

## 6. Desplegar

```bash
git push origin main
```

Esto dispara `azure-deploy.yml`:
1. Login OIDC en Azure.
2. `az acr build` construye y sube la imagen al ACR.
3. La Web App se apunta a la nueva imagen y se reinicia.
4. Al arrancar, el contenedor ejecuta `prisma migrate deploy` y levanta Next.js.

La app quedará en: **https://&lt;AZURE_WEBAPP_NAME&gt;.azurewebsites.net**

---

## 7. Sembrar datos en producción (una sola vez)

Las migraciones se aplican solas, pero el seed es manual. Opciones:

```bash
# Opción A: ejecutar el seed desde tu máquina contra la BD de Azure
#   (agrega temporalmente tu IP al firewall del PostgreSQL)
az postgres flexible-server firewall-rule create \
  --resource-group "$RG" --name "$PG" \
  --rule-name miip --start-ip-address <TU_IP> --end-ip-address <TU_IP>

DATABASE_URL="$DATABASE_URL" npm run db:seed

# Opción B: ejecutar el seed dentro del contenedor (SSH de App Service)
#   az webapp ssh -g "$RG" -n "$APP"  →  luego:  npm run db:seed
```

---

## Notas

- **Migraciones**: se ejecutan automáticamente en cada arranque del contenedor
  (`CMD` del `Dockerfile`). Si prefieres ejecutarlas como paso del pipeline,
  añade un job que corra `npx prisma migrate deploy` con `DATABASE_URL`.
- **Costos**: recuerda apagar/eliminar recursos al terminar
  (`az group delete --name "$RG" --yes --no-wait`).
- **Alternativa sin Docker**: también puedes desplegar como app de Node en App
  Service (build con Oryx y `startup command`:
  `npx prisma migrate deploy && npm run start`). El enfoque con contenedor es
  más reproducible y es el recomendado aquí.
