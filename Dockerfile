FROM node:24.16.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
ENV CI=true
ENV PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"

RUN corepack enable && corepack prepare pnpm@11.2.2 --activate
RUN pnpm config set store-dir /pnpm/store

WORKDIR /app


FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# Necesario mientras el backend genere PDF con Playwright/Chromium.
# Esta etapa instala también dependencias del sistema.
RUN pnpm exec playwright install --with-deps chromium


FROM deps AS builder

# Placeholders de build para Prisma/Next. Las variables reales entran en runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

COPY . .

RUN pnpm prisma generate
RUN pnpm build


FROM deps AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV PLAYWRIGHT_BROWSERS_PATH="/ms-playwright"

# Guardrail inicial. No es la optimización principal.
# Se ajusta después de medir en Coolify.
ENV NODE_OPTIONS="--max-old-space-size=1536"

WORKDIR /app

# Archivos requeridos por Prisma y runtime.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

# Assets públicos y salida standalone de Next.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node server.js"]