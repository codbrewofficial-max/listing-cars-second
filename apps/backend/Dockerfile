# =========================================================
# Dockerfile — Backend LCS (Node.js + TypeScript + PostgreSQL)
# Multi-stage build: builder (compile TS) -> runtime (jalankan)
# =========================================================

# ---- Stage 1: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Build tools untuk native addon (bcrypt butuh compiler, sharp butuh libvips)
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Runtime lib untuk sharp (libvips) — fallback kalau prebuilt binary tidak cocok arsitektur VPS
RUN apk add --no-cache vips

COPY package.json package-lock.json ./

# Ambil node_modules & hasil build dari stage builder (sudah include devDependencies:
# node-pg-migrate & tsx sengaja tetap dibawa karena dipakai entrypoint untuk migrate & seed)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# src dibawa UTUH (bukan hasil compile), bukan cuma src/db, karena:
# - migrate:up membaca file .js di src/db/migrations langsung (lihat package.json)
# - seed:superadmin menjalankan src/db/seed/superadmin.ts lewat tsx, dan file itu
#   mengimpor ../../config/db, ../../config/env, ../../config/logger — jadi
#   seluruh src/config (dan folder lain yang mungkin di-import seed/skrip lain
#   di masa depan) harus ikut, tidak cukup cuma src/db saja.
COPY --from=builder /app/src ./src

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && \
    chown -R node:node /app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

USER node

ENTRYPOINT ["/app/entrypoint.sh"]