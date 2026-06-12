# Buzón Inteligente UTMACH

Plataforma de participación universitaria para la **Universidad Técnica de Machala (UTMACH)**. Permite que estudiantes, docentes y personal administrativo envíen **quejas, sugerencias, ideas de proyectos, propuestas de investigación, problemas detectados y reconocimientos**, y ofrece un **dashboard administrativo** con indicadores, filtros y exportación CSV.

Construido **100% con Next.js (App Router)** — sin backend separado. La lógica de servidor vive en Server Actions y Route Handlers; Prisma habla directamente con PostgreSQL.

> El sistema queda **preparado para futuras integraciones de NLP** (campo `metadata` JSONB, categorías y etiquetas normalizadas), pero **no implementa NLP** en esta fase.

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework full-stack | **Next.js 15** (App Router, Server Actions, Route Handlers) |
| Lenguaje | **TypeScript** (estricto) |
| Estilos / UI | **Tailwind CSS** + **shadcn/ui** + **lucide-react** |
| Tipografía | **Myriad Pro** (institucional; con fallback automático) |
| Validación | **Zod** (compartida cliente/servidor) |
| ORM / BD | **Prisma** + **PostgreSQL** |
| Datos en cliente | **TanStack React Query** (dropdowns en cascada) |
| Autenticación | **Auth.js (NextAuth v5)** — credenciales del administrador |
| Gráficos | **Recharts** |
| Infraestructura | **Docker Compose** (PostgreSQL) |

---

## 🎨 Identidad visual UTMACH

| Color | Pantone | Hex | Uso |
|---|---|---|---|
| 🔵 Azul institucional | 301 EC | `#005ca2` | Color primario (botones, énfasis, gráficos) |
| 🔷 Azul claro | 2925 EC | `#53aae1` | Color secundario / apoyo |
| 🔴 Rojo | 185 EC | `#C2354a` | **Solo detalles ligeros** (campos obligatorios, errores, un acento) |

Tipografía: **Myriad Pro** (Regular, Italic, Semibold, Semibold Italic, Bold, Bold Italic). Ver [`public/fonts/README.txt`](public/fonts/README.txt) para activarla con los archivos licenciados; sin ellos se usa una pila de respaldo equivalente.

---

## 🏗️ Arquitectura

Separación por capas (principios SOLID):

- **Dominio** → `lib/validations/` (Zod), `lib/constants.ts`, modelos Prisma.
- **Aplicación** → `actions/` (Server Actions) y `lib/services/` (lógica reutilizable: stats, consultas).
- **Infraestructura** → `lib/prisma.ts`, `lib/auth.ts`, `app/api/**` (Route Handlers).
- **Presentación** → `app/**` (páginas) y `components/**`.

```
app/
  page.tsx                  # Landing institucional
  form/page.tsx             # Formulario parametrizable por URL
  login/page.tsx            # Acceso al panel
  dashboard/                # Panel admin (protegido por middleware)
    page.tsx                #   indicadores
    submissions/page.tsx    #   tabla con filtros + export CSV
  api/                      # Route Handlers (faculties, careers, categories, export, auth)
actions/                    # Server Actions (submissions, auth)
components/                 # ui/ (shadcn), form/, dashboard/
lib/                        # prisma, auth, hooks, services, validations, types
prisma/                     # schema.prisma, migrations/, seed.ts
```

---

## 🚀 Puesta en marcha

### Requisitos
- Node.js 18.18+ (probado en Node 25)
- Docker (para PostgreSQL)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno
cp .env.example .env
#    (opcional) genera un secreto: openssl rand -base64 32  →  AUTH_SECRET

# 3. Levantar PostgreSQL
npm run db:up

# 4. Aplicar migraciones (crea las tablas)
npm run db:migrate

# 5. Sembrar facultades, carreras y categorías de la UTMACH
npm run db:seed

# 6. Arrancar en desarrollo
npm run dev
```

Abre **http://localhost:3000**.

- Formulario público: **/form**
- Panel administrativo: **/login** → **/dashboard** (acceso **no enlazado** desde el sitio público; navega directamente a `/login`)

### Credenciales del administrador

Se definen mediante las variables de entorno **`ADMIN_EMAIL`** y
**`ADMIN_PASSWORD`** (ver [`.env.example`](.env.example)). Define una
contraseña segura propia; **no** la subas al repositorio.

---

## 🔗 Formulario parametrizable por URL

El formulario se personaliza vía query params, ideal para generar **un QR por facultad o carrera**:

| URL | Comportamiento |
|---|---|
| `/form` | Formulario general |
| `/form?faculty=ingenieria-civil` | Preselecciona la facultad |
| `/form?faculty=ingenieria-civil&career=ingenieria-civil` | Preselecciona facultad y carrera |
| `/form?faculty=ingenieria-civil&hideFaculty=true` | Oculta el selector de facultad |
| `/form?faculty=ingenieria-civil&career=ingenieria-civil&readonly=true` | Bloquea esos campos |

Parámetros: `faculty`, `career`, `category`, `type`, `hideFaculty`, `hideCareer`, `readonly`. Se resuelven por **slug** (legible).

Los **dropdowns son dependientes**: al elegir facultad se cargan solo sus carreras (vía React Query). Si la facultad llega en la URL, las carreras se **precargan en el servidor** sin recargar la página.

---

## 📊 Dashboard

Ruta protegida (`middleware.ts` + Auth.js). Incluye:

- **KPIs**: total de aportes, facultades/carreras con aportes, aportes de los últimos 7 días.
- **Gráficos**: por tipo, por facultad, top carreras, por categoría y **evolución temporal**.
- **Tabla** de aportes con **filtros** (búsqueda, tipo, prioridad, facultad, categoría, rango de fechas) y paginación.
- **Exportación CSV** (`/api/submissions/export`) respetando los filtros activos.

---

## 🗃️ Modelo de datos

`Faculty`, `Career`, `Category`, `Tag`, `Submission`, `SubmissionTag`, `FormConfiguration`.
Ver [`prisma/schema.prisma`](prisma/schema.prisma). El campo `Submission.metadata` (JSONB) queda reservado para NLP.

### Oferta académica sembrada (UTMACH)
5 facultades y 31 carreras: Ciencias Agropecuarias, Ciencias Empresariales, Ciencias Sociales, Ciencias Químicas y de la Salud, e Ingeniería Civil. Editable desde la base de datos / [`prisma/seed.ts`](prisma/seed.ts).

---

## 📜 Scripts npm

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (genera Prisma Client) |
| `npm start` | Servidor de producción |
| `npm run db:up` / `db:down` | Levantar / bajar PostgreSQL (Docker) |
| `npm run db:migrate` | Crear/aplicar migraciones (desarrollo) |
| `npm run db:deploy` | Aplicar migraciones (producción) |
| `npm run db:seed` | Sembrar datos de la UTMACH |
| `npm run db:studio` | Abrir Prisma Studio |
| `npm run db:reset` | Reiniciar la base de datos |

---

## 🔐 Variables de entorno

Ver [`.env.example`](.env.example):

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciales que usa Docker Compose |
| `AUTH_SECRET` | Secreto de Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` | URL base de la app |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del administrador del panel |

---

## ☁️ Despliegue y CI/CD (Azure + GitHub Actions)

El proyecto está listo para CI/CD continuo hacia **Azure**:

- **Azure Database for PostgreSQL – Flexible Server** → base de datos gestionada.
- **Azure Container Registry (ACR)** → imagen Docker de la app.
- **Azure App Service (Web App for Containers, Linux)** → ejecuta el contenedor.
- **GitHub Actions** con login **OIDC** (sin secretos de larga duración):
  - [`.github/workflows/ci.yml`](.github/workflows/ci.yml): lint + build en cada push/PR.
  - [`.github/workflows/azure-deploy.yml`](.github/workflows/azure-deploy.yml): en push a `main`, construye la imagen en ACR y actualiza la Web App.
- Las **migraciones Prisma** se aplican solas al iniciar el contenedor ([`Dockerfile`](Dockerfile)).

📘 Guía paso a paso (provisión con `az` CLI, secrets, OIDC): **[docs/DEPLOY-AZURE.md](docs/DEPLOY-AZURE.md)**.

### Probar la imagen Docker localmente

```bash
docker build -t buzon-utmach .
docker run -p 3000:3000 --env-file .env buzon-utmach
```

---

## 🔮 Preparado para NLP (futuro)

- `Submission.metadata` (JSONB) para guardar features/etiquetas y la **prioridad** que asignará el modelo.
- `Category` (y el modelo `Tag`, reservado) normalizados para clasificación.
- Endpoints de lectura listos para que un servicio externo de NLP consuma los datos.

---

© Universidad Técnica de Machala — Buzón Inteligente.
