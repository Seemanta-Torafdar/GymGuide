# ============================================================================
# GYMGUIDE BACKEND - MULTI-STAGE PRODUCTION DOCKERFILE
# Stage 1: Build & Prisma Client Generation
# Stage 2: Hardened Non-Root Production Runtime
# ============================================================================

# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL required by Prisma Engine on Alpine Linux
RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY .babelrc register.js ./
COPY src ./src/
RUN npm run build

# --- STAGE 2: PRODUCTION RUNTIME ---
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl curl && \
    addgroup -g 1001 -S gymguide && \
    adduser -S gymguide -u 1001 -G gymguide

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=builder --chown=gymguide:gymguide /app/package.json ./
COPY --from=builder --chown=gymguide:gymguide /app/node_modules ./node_modules
COPY --from=builder --chown=gymguide:gymguide /app/prisma ./prisma
COPY --from=builder --chown=gymguide:gymguide /app/dist ./dist

# Drop root privileges
USER gymguide

EXPOSE 4000

HEALTHCHECK --interval=20s --timeout=5s --start-period=25s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

# Apply pending Prisma migrations, seed initial catalog if needed, and launch server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/main.js"]
