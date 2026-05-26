# ── Stage 1: Build ─────────────────────────────────────────────
FROM oven/bun:1.3.4-alpine AS builder
WORKDIR /app

# Copia file di dipendenze e installa
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copia il resto del codice sorgente
COPY . .

# Genera il client Prisma
RUN bunx prisma generate

# Build dell'applicazione Next.js (output standalone)
RUN bun run build

# Copia file statici nel bundle standalone
RUN cp -r .next/static .next/standalone/.next/static
RUN cp -r public .next/standalone/public

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM oven/bun:1.3.4-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia il bundle standalone
COPY --from=builder /app/.next/standalone ./

# Copia schema Prisma e client generato (necessario a runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Directory per il database SQLite (montata come volume)
RUN mkdir -p /app/db

# Porta di ascolto
EXPOSE 3000

# Avvio del server
CMD ["bun", "server.js"]
