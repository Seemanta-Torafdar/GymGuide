# Security Policy & Architecture — GymGuide

GymGuide treats security as a foundational engineering requirement across the React frontend, NestJS backend, PostgreSQL database, and Docker container infrastructure.

---

## 1. Security Architecture Overview

```
[ Browser Client ]
       │
       │ HTTPS / Port 8080 (Security Headers + CSP)
       ▼
[ Frontend Container: nginx-unprivileged (Non-Root UID 101) ]
       │
       │ Reverse Proxy (/api/v1/*) over gymguide_edge network
       ▼
[ Backend Container: NestJS JavaScript API (Non-Root UID 1001) ]
  ├─ Helmet Security Headers & X-Powered-By removal
  ├─ Strict CORS Origin Allowlist
  ├─ Express JSON/URL-Encoded Payload Size Limit (100 KB)
  ├─ Sliding-Window IP Rate Limiter (RateLimitGuard)
  ├─ Anti-Mass-Assignment & HTML/XSS Input Sanitizer (DtoValidationPipe)
  ├─ Centralized Safe Exception Filter (AllExceptionsFilter)
       │
       │ Parameterized Prisma ORM Queries over internal network (gymguide_internal)
       ▼
[ Database Container: PostgreSQL 16 Alpine (Internal Network Only) ]
```

---

## 2. Authentication & Session Strategy

For optional user accounts (`AuthModule` & `UsersModule`):

- **Password Hashing**: Passwords are never stored in plaintext. All passwords are hashed using `bcryptjs` with a work factor (cost) of `12`.
- **Short-Lived Access Tokens**: JWT access tokens expire in `15m` (`JWT_ACCESS_EXPIRES_IN`).
- **Rotating Refresh Tokens**: Refresh tokens expire in `7d` (`JWT_REFRESH_EXPIRES_IN`), include a unique cryptographic `jti`, and their bcrypt hash is stored on the `users` table (`refresh_token_hash`). Every call to `POST /api/v1/auth/refresh` verifies the hash and rotates both tokens.
- **HttpOnly Cookie Storage**: Authentication tokens are delivered via `HttpOnly`, `SameSite`, and `Secure` (in production) cookies (`gymguide_access_token` and `gymguide_refresh_token`). **Tokens are never stored in `localStorage` or `sessionStorage`**, preventing credential theft via XSS.
- **Brute-Force Lockout**: After 5 consecutive failed login attempts, the account is temporarily locked for 15 minutes (`failed_login_count` and `locked_until` on the `users` table), and auth endpoints enforce a stricter IP rate limit (20 requests/minute).
- **Logout & Revocation**: `POST /api/v1/auth/logout` clears the stored `refresh_token_hash` in PostgreSQL and expires both HttpOnly cookies immediately.
- **No Unauthenticated Mutation Endpoints**: All public exercise, muscle, equipment, and workout plan endpoints are strictly read-only (`GET`). Exercise content is managed via version-controlled database seed files (`backend/prisma/seed.js`).

---

## 3. API Protection Measures

1. **Strict Input Validation & Anti-Mass-Assignment (`DtoValidationPipe`)**:
   - Every incoming request payload is validated against an explicit whitelist schema.
   - Any unexpected property (such as an attacker injecting `"role": "ADMIN"`) triggers an immediate `400 Bad Request` rejection.
   - Prototype pollution keys (`__proto__`, `constructor`, `prototype`) are stripped.
2. **Input Sanitization (`sanitize.util.js`)**:
   - Query strings, slugs, and text inputs are stripped of null bytes, HTML tags (`<script>`, event handlers), and `javascript:` URIs, and clamped to maximum character lengths.
3. **Rate Limiting & Throttling (`RateLimitGuard`)**:
   - Global sliding-window rate limiter enforces `RATE_LIMIT_MAX_REQUESTS` (default 150 req/min for read APIs, 20 req/min for `/auth/*`) per client IP.
   - Emits `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` HTTP headers.
4. **Secure HTTP Headers (`Helmet`)**:
   - Content Security Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and removal of `X-Powered-By`.
5. **Request Size & Pagination Limits**:
   - Request bodies are limited to `100kb` (`BODY_LIMIT_KB`).
   - Pagination `limit` parameters are clamped to a maximum of `100` items per page (`parsePagination`) to prevent memory exhaustion.
6. **Centralized Safe Error Responses (`AllExceptionsFilter`)**:
   - Standardized JSON error envelopes without internal stack traces or database connection strings.

---

## 4. Database Security (PostgreSQL & Prisma)

- **SQL Injection Prevention**: All database queries use Prisma ORM's parameterized query engine. Raw string-concatenated SQL is strictly prohibited.
- **Least-Privilege Application User**: Configured to connect as `gymguide_app` rather than the `postgres` superuser.
- **Network Isolation**: In `docker-compose.yml`, the `postgres` container is attached exclusively to the `gymguide_internal` bridge network (`internal: true`) and does **not** publish port `5432` to the host or public internet.

---

## 5. Environment Configuration Security

- Separate environment templates are maintained:
  - `.env.example` (committed safe template)
  - `.env.development` (gitignored local development variables)
  - `.env.production` (gitignored production template requiring secret manager injection)
- **Startup Validation (`env.validation.js`)**: Validates required variables at boot and aborts startup if `NODE_ENV=production` is paired with default/placeholder secrets.

---

## 6. Docker Security

- **Official Minimal Base Images**: Uses `node:20-alpine`, `postgres:16-alpine`, and `nginxinc/nginx-unprivileged:1.27-alpine`.
- **Multi-Stage Builds**: Both `frontend/Dockerfile` and `backend/Dockerfile` compile assets in an isolated `builder` stage and copy only production artifacts into the runtime stage.
- **Non-Root Execution**:
  - Backend runs as dedicated non-root user `gymguide` (`UID 1001`).
  - Frontend runs as non-root `nginx` user (`UID 101`) on unprivileged port `8080`.
- **Privilege Hardening**: All containers set `security_opt: ["no-new-privileges:true"]` and configure automated `HEALTHCHECK` probes.

---

## 7. Production Deployment Security Checklist

- [ ] Replace `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` with high-entropy secrets (minimum 256-bit / 64 hex chars) via your cloud secret manager.
- [ ] Set `NODE_ENV=production`, `COOKIE_SECURE=true`, and `COOKIE_SAME_SITE=strict`.
- [ ] Restrict `CORS_ORIGINS` to your exact production HTTPS domain (e.g., `https://gymguide.yourdomain.com`).
- [ ] Terminate TLS/HTTPS (TLS 1.2/1.3) at your ingress load balancer or reverse proxy.
- [ ] Verify PostgreSQL port `5432` remains unpublished (`ports:` omitted on `postgres` service).
- [ ] Schedule automated encrypted `pg_dump` backups of the `gymguide_pgdata` volume.
