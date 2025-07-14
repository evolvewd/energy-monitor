# Frontend Dockerfile per Energy Monitor
FROM node:18-alpine AS base

# Installa dipendenze solo quando necessario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia file di dipendenze
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild dei moduli nativi per Alpine
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disabilita telemetria Next.js durante il build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Immagine di produzione
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Imposta permessi per la cache Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia automaticamente gli output dal builder in base al target
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]