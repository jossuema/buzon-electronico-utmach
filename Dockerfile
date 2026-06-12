# syntax=docker/dockerfile:1
# Imagen de producción para el Buzón Inteligente UTMACH (Next.js + Prisma).

FROM node:20-alpine AS base
WORKDIR /app
# openssl y libc6-compat son requeridos por los motores de Prisma en Alpine.
RUN apk add --no-cache libc6-compat openssl

# --- Dependencias ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Variables de marcador de posición: el build NO se conecta a la base de datos
# (las páginas son dinámicas), solo necesita que las variables existan.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV AUTH_SECRET="build-time-placeholder"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Usuario sin privilegios.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# Aplica migraciones pendientes y arranca el servidor.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
