# Plan de Construcción — Buzón Inteligente UTMACH

> Plataforma de participación universitaria para la **Universidad Técnica de Machala (UTMACH)**.
> Stack: **Next.js (App Router) full-stack — sin backend separado.**

---

## 1. Objetivo

Construir una plataforma de participación universitaria tipo **"Buzón Inteligente"** donde estudiantes, docentes y personal administrativo puedan enviar:

- Quejas
- Sugerencias
- Ideas de proyectos
- Propuestas de investigación
- Problemas detectados
- Reconocimientos

Los datos alimentarán analítica, dashboards y, **a futuro**, funcionalidades de NLP.

> ⚠️ **NO se implementa NLP en esta fase.** El modelo de datos solo queda preparado (campo `metadata` JSONB y categorías/etiquetas) para integraciones futuras.

---

## 2. Decisión de arquitectura

El plan original proponía **NestJS + Next.js en monorepo**. Para este proyecto universitario lo simplificamos a:

### Next.js full-stack (un solo proyecto)

Next.js (App Router) **ya es el backend y el frontend a la vez**:

| Necesidad | Antes (NestJS) | Ahora (Next.js puro) |
|---|---|---|
| Lógica de negocio / API | Controllers + Services NestJS | **Server Actions** + **Route Handlers** (`app/api/**`) |
| Validación | class-validator | **Zod** |
| ORM | Prisma | **Prisma** (igual, corre del lado servidor) |
| Documentación API | Swagger | No necesario (API interna); opcional `/api/docs` con OpenAPI si se requiere |
| Auth | Passport/JWT | **Auth.js (NextAuth) Credentials** o middleware simple |
| Datos en cliente | — | **TanStack React Query** para dropdowns en cascada |

**Ventajas para el contexto universitario:**
- Un solo despliegue, un solo `package.json`, un solo lenguaje.
- Menos infraestructura (no hay servicio backend separado).
- Server Components consultan Prisma directamente → menos código de "API glue".
- Más fácil de mantener y de calificar/entender por el tribunal.

---

## 3. Estructura del proyecto

Proyecto único (sin monorepo). Si más adelante se quiere escalar, se puede extraer `lib/` a un paquete.

```
buzon-electronico-utmach/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                  # Landing institucional UTMACH
│  │  └─ form/
│  │     └─ page.tsx               # Formulario parametrizable por URL
│  ├─ (admin)/
│  │  ├─ login/page.tsx            # Login del dashboard
│  │  └─ dashboard/
│  │     ├─ page.tsx               # Indicadores
│  │     ├─ submissions/page.tsx   # Tabla con filtros + export CSV
│  │     └─ config/page.tsx        # FormConfiguration, facultades, etc.
│  ├─ api/
│  │  ├─ faculties/route.ts        # GET facultades
│  │  ├─ careers/route.ts          # GET carreras?facultyId=
│  │  ├─ submissions/
│  │  │  ├─ route.ts               # POST crear, GET listar (admin)
│  │  │  └─ export/route.ts        # GET export CSV
│  │  └─ dashboard/stats/route.ts  # GET métricas agregadas
│  ├─ layout.tsx
│  └─ globals.css
├─ actions/                        # Server Actions
│  ├─ submissions.ts               # createSubmission(...)
│  └─ config.ts
├─ components/
│  ├─ ui/                          # shadcn/ui
│  ├─ form/                        # SubmissionForm, CascadingSelects, TagInput
│  └─ dashboard/                   # Charts, DataTable, Filters
├─ lib/
│  ├─ prisma.ts                    # Singleton de PrismaClient
│  ├─ auth.ts                      # Configuración Auth.js
│  ├─ validations/                 # Esquemas Zod (DTOs)
│  └─ utils.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ migrations/
│  └─ seed.ts
├─ public/                         # Logos UTMACH, favicon
├─ docker-compose.yml              # Postgres (+ app opcional)
├─ Dockerfile
├─ .env.example
├─ middleware.ts                   # Protege /dashboard
├─ package.json
└─ README.md
```

**Separación de responsabilidades (SOLID / capas):**
- **Dominio**: tipos y esquemas Zod en `lib/validations/` + modelos Prisma.
- **Aplicación**: Server Actions (`actions/`) y servicios en `lib/services/` (lógica reutilizable).
- **Infraestructura**: `lib/prisma.ts`, Route Handlers, Auth.js.
- **Presentación**: `app/**` y `components/**`.

---

## 4. Stack técnico

- **Next.js 15** (App Router, Server Actions, Route Handlers)
- **TypeScript** (estricto)
- **Tailwind CSS** + **shadcn/ui** (diseño moderno e institucional, responsive)
- **Prisma** + **PostgreSQL**
- **Zod** (validación de DTOs en cliente y servidor)
- **TanStack React Query** (dropdowns dependientes sin recargar)
- **Auth.js (NextAuth)** — Credentials Provider (login simple admin)
- **Recharts** (gráficos del dashboard)
- **Docker Compose** (PostgreSQL; app opcional)

---

## 5. Modelo de base de datos (Prisma)

PostgreSQL. Esquema inicial:

```prisma
enum SubmissionType {
  QUEJA
  SUGERENCIA
  IDEA_PROYECTO
  INVESTIGACION
  RECONOCIMIENTO
  OTRO
}

enum Priority {
  BAJA
  MEDIA
  ALTA
  CRITICA
}

model Faculty {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  active    Boolean  @default(true)
  careers   Career[]
  submissions Submission[]
  formConfigs FormConfiguration[]
}

model Career {
  id        String   @id @default(cuid())
  facultyId String
  faculty   Faculty  @relation(fields: [facultyId], references: [id])
  name      String
  slug      String
  active    Boolean  @default(true)
  submissions Submission[]
  @@unique([facultyId, slug])
}

model Category {
  id     String  @id @default(cuid())
  name   String  @unique
  active Boolean @default(true)
  submissions Submission[]
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  submissions SubmissionTag[]
}

model Submission {
  id           String         @id @default(cuid())
  type         SubmissionType
  facultyId    String?
  faculty      Faculty?       @relation(fields: [facultyId], references: [id])
  careerId     String?
  career       Career?        @relation(fields: [careerId], references: [id])
  categoryId   String?
  category     Category?      @relation(fields: [categoryId], references: [id])
  title        String
  description  String
  priority     Priority       @default(MEDIA)
  contactEmail String?        // opcional → permite envío anónimo
  metadata     Json?          // JSONB, reservado para NLP futuro
  createdAt    DateTime       @default(now())
  tags         SubmissionTag[]
}

model SubmissionTag {
  submissionId String
  tagId        String
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  tag          Tag        @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([submissionId, tagId])
}

model FormConfiguration {
  id             String   @id @default(cuid())
  facultyId      String?  // null = configuración global
  faculty        Faculty? @relation(fields: [facultyId], references: [id])
  title          String
  description    String?
  allowAnonymous Boolean  @default(true)
  active         Boolean  @default(true)
}
```

> Las migraciones se generan con `prisma migrate dev` (desarrollo) y `prisma migrate deploy` (producción).

---

## 6. Formulario parametrizable por URL

El formulario en `/form` lee `searchParams` y configura los campos. Soporta:

| URL | Comportamiento |
|---|---|
| `/form` | Formulario general |
| `/form?faculty=ingenieria` | Preselecciona facultad Ingeniería |
| `/form?faculty=ingenieria&career=sistemas` | Preselecciona facultad y carrera |
| `/form?faculty=ingenieria&hideFaculty=true` | Oculta el selector de facultad |
| `/form?faculty=ingenieria&career=sistemas&readonly=true` | Bloquea esos campos |

Esto permite generar **un QR distinto por facultad o carrera**.

**Parámetros soportados:** `faculty`, `career`, `category`, `hideFaculty`, `hideCareer`, `readonly`, `type`.

Se resuelven por `slug` (legible en la URL), no por id.

---

## 7. Dropdowns en cascada

Flujo: **Seleccionar Facultad → cargar Carreras de esa facultad** (nunca carreras de otras).

- Hook `useCareers(facultyId)` con **React Query** → `GET /api/careers?facultyId=`.
- Si la facultad viene en la URL: las carreras se **precargan automáticamente sin recargar la página**.
- Las facultades se pueden cargar en un Server Component (datos iniciales) y las carreras vía React Query al cambiar la selección.

---

## 8. Formulario — campos

- **Tipo de aporte**: Queja · Sugerencia · Idea de proyecto · Investigación · Reconocimiento · Otro
- **Facultad** (cascada)
- **Carrera** (cascada, depende de facultad)
- **Título**
- **Descripción**
- **Prioridad**: Baja · Media · Alta · Crítica
- **Etiquetas** (multi-select / creación rápida)
- **Correo de contacto** (opcional)
- **Envío anónimo** (cuando `allowAnonymous` está activo en `FormConfiguration`)

Validación con **Zod** compartida entre cliente (UX inmediata) y Server Action (seguridad). El envío usa una **Server Action** `createSubmission`.

---

## 9. Dashboard administrativo

Ruta `/dashboard` **protegida** por `middleware.ts` + Auth.js.

**Indicadores:**
- Total de aportes
- Aportes por facultad
- Aportes por carrera
- Aportes por categoría
- Evolución temporal (serie de tiempo)

**Tablas:** con filtros (tipo, facultad, carrera, prioridad, rango de fechas) y paginación.

**Exportación CSV:** `GET /api/submissions/export` respetando los filtros activos.

Gráficos con **Recharts**. Agregaciones con `prisma.groupBy` / SQL.

---

## 10. Autenticación (simple)

- **Auth.js (NextAuth)** con **Credentials Provider**.
- Usuario admin definido por variables de entorno o tabla `User` (opcional añadirla).
- `middleware.ts` protege `/dashboard/**`; redirige a `/login` si no hay sesión.
- Suficiente para el alcance institucional; se puede migrar a SSO de la UTMACH después.

---

## 11. Seed inicial

Script `prisma/seed.ts` (`npm run db:seed`) con datos **reales de la UTMACH**, configurables desde BD:

- **Facultades** de la UTMACH (Ingeniería Civil, Ciencias Sociales, Ciencias Químicas y de la Salud, Ciencias Empresariales, Ciencias Agropecuarias, etc.).
- **Carreras** por facultad.
- **Categorías** base.
- Un **FormConfiguration** global y un usuario admin de ejemplo.

> Las facultades/carreras del seed se ajustarán a la oferta académica vigente de la UTMACH.

---

## 12. Docker y entorno

`docker-compose.yml`:
- Servicio **postgres** (con volumen persistente).
- Servicio **app** (opcional) construido desde `Dockerfile`.

`.env.example`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/buzon_utmach?schema=public"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@utmachala.edu.ec"
ADMIN_PASSWORD="..."
```

---

## 13. Scripts npm

```jsonc
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "db:up": "docker compose up -d postgres",
  "db:migrate": "prisma migrate dev",
  "db:deploy": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset"
}
```

---

## 14. Calidad y entregables

- **DTOs/validaciones**: esquemas Zod en `lib/validations/`.
- **Prisma schema** + **migraciones** automáticas.
- **Docker Compose** + **Dockerfile** + `.env.example`.
- **README** completo (instalación, comandos, arquitectura, despliegue).
- **Scripts npm** listos.
- Principios **SOLID** y separación dominio / aplicación / infraestructura / presentación.
- Diseño responsive e institucional con la identidad visual de la **UTMACH**.

---

## 15. Preparación para NLP (futuro, no implementar ahora)

- Campo `metadata` JSONB en `Submission` para guardar features/etiquetas generadas.
- `Category` y `Tag` ya normalizados para clasificación.
- Endpoints de lectura (`/api/submissions`) que un servicio de NLP externo podrá consumir más adelante.

---

## 16. Fases de implementación sugeridas

1. **Setup**: Next.js + TS + Tailwind + shadcn/ui + Prisma + Docker Postgres.
2. **Datos**: `schema.prisma`, primera migración, `seed.ts` UTMACH.
3. **Formulario**: campos + Zod + Server Action + parámetros de URL.
4. **Cascada**: API facultades/carreras + React Query.
5. **Auth**: Auth.js Credentials + middleware.
6. **Dashboard**: indicadores, tablas con filtros, export CSV, gráficos.
7. **Config admin**: gestión de facultades/carreras/categorías/FormConfiguration.
8. **Pulido**: responsive, branding UTMACH, README, despliegue.
```
