# ============================================================================
# GYMGUIDE FRONTEND - MULTI-STAGE PRODUCTION DOCKERFILE
# Stage 1: Vite React Production Build
# Stage 2: Hardened Non-Root Nginx Unprivileged Runtime
# ============================================================================

# --- STAGE 1: BUILDER ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src/

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- STAGE 2: NON-ROOT PRODUCTION NGINX ---
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

USER root
RUN apk add --no-cache curl
USER nginx

COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
