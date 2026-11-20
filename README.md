# GYMGUIDE — Interactive Muscle Explorer & Workout Learning Platform

> **"Train Smarter. Understand Every Muscle."**

GymGuide is a modern, responsive, security-focused fitness learning platform built for gym beginners who want to visually explore human muscle anatomy, discover targeted exercises, master safe biomechanics, compare exercise variations, and follow structured beginner workout routines.

---

## 1. Key Features

- **Interactive 360° Human Muscle Map (Front, Back & Dual SVG Views)**:
  - **Front Body Muscle Groups (8 Clickable Regions)**: Chest (*Pectoralis Major*), Front Deltoids, Biceps, Forearms, Rectus Abdominis, Obliques, Quadriceps, Calves.
  - **Back Body Muscle Groups (8 Clickable Regions)**: Trapezius, Latissimus Dorsi, Rear Deltoids, Triceps, Lower Back (*Erector Spinae*), Glutes, Hamstrings, Calves.
  - Highlights both **Primary Target Muscles** (`#35D98A`) and **Secondary Synergist Muscles** (`#F59E0B`) directly on the anatomical SVG model.
- **Complete Exercise Library (55+ Verified Gym Exercises)**:
  - Covers all 10 categories: *Chest, Back, Shoulders, Biceps, Triceps, Forearms, Abs, Legs, Glutes, and Calves*.
  - Filter by muscle group, required equipment, difficulty level (*Beginner, Intermediate, Advanced*), and exercise mechanics (*Compound, Isolation, Stability*).
- **Dedicated Exercise Details Pages**:
  - Animated SVG biomechanical movement demonstration, dual anatomical muscle involvement diagram, starting position, numbered step-by-step instructions with coaching cues, recommended sets/reps/rest guidance, common mistakes, safety tips, and similar exercises.
- **Debounced Global Search System (`Ctrl + K`)**:
  - Instant search across exercise names (*"Bench Press"*), muscle names (*"Chest"*), equipment (*"Dumbbell"*), and categories.
- **6 Structured Beginner Workout Plans**:
  1. **Full Body Workout** (3 Days/Week)
  2. **Upper/Lower Split** (4 Days/Week)
  3. **Push/Pull/Legs** (3 Days/Week)
  4. **Beginner 3-Day Workout** (3 Days/Week)
  5. **Beginner 4-Day Workout** (4 Days/Week)
  6. **Beginner 6-Day Workout** (6 Days/Week)
- **Side-by-Side Exercise Comparison Lab**:
  - Compare any two exercises (e.g., *Barbell Bench Press vs. Dumbbell Bench Press*) across primary/secondary muscles, equipment, difficulty, movement differences, advantages, and limitations.

---

## 2. Technology Stack (100% JavaScript ES6+)

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, JavaScript (ES6+), Vite, Tailwind CSS, Framer Motion, Lucide React, React Router v6, Axios |
| **Backend** | NestJS 10 (JavaScript ES6+ with Babel decorators), RESTful API (`/api/v1`), DTO Validation Pipe, Swagger / OpenAPI |
| **Database** | PostgreSQL 16, Prisma ORM, Prisma Migrations, Relational Seed Dataset |
| **Security** | Helmet, CORS Allowlisting, Sliding-Window Rate Limiter, Anti-Mass-Assignment DTO Pipe, HttpOnly JWT Cookies, bcrypt (cost 12) |
| **Containers** | Docker, Docker Compose, Multi-Stage Alpine Builds, Non-Root Containers, Isolated Internal DB Network |

---

## 3. Project Structure

```text
gymguide/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── anatomy/        # InteractiveMuscleMap, MuscleExplorerSection, MiniMuscleDiagram
│   │   │   ├── exercises/      # ExerciseCard, ExerciseVisualDemo
│   │   │   └── common/         # GlobalSearchModal
│   │   ├── pages/              # HomePage, MuscleExplorerPage, ExerciseLibraryPage, ExerciseDetailPage, WorkoutPlansPage, WorkoutPlanDetailPage, ExerciseComparePage
│   │   ├── layouts/            # Navbar, Footer, MainLayout
│   │   ├── hooks/              # useDebounce
│   │   ├── services/           # api.service.js (Axios client with TTL cache)
│   │   ├── context/            # GymGuideContext
│   │   ├── utils/              # formatters.js
│   │   ├── data/               # anatomyPaths.js (Front & Back SVG paths)
│   │   └── styles/             # index.css
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── modules/            # health, muscles, exercises, equipment, workout-plans, search, auth, users
│   │   ├── common/             # dto-validator.pipe.js, sanitize.util.js
│   │   ├── config/             # env.validation.js
│   │   ├── database/           # prisma.service.js, prisma.module.js
│   │   ├── guards/             # rate-limit.guard.js, jwt-auth.guard.js
│   │   ├── filters/            # all-exceptions.filter.js
│   │   ├── interceptors/       # response-transform.interceptor.js
│   │   ├── app.module.js
│   │   └── main.js
│   ├── prisma/
│   │   ├── schema.prisma       # 12 relational PostgreSQL tables
│   │   ├── migrations/         # Initial SQL migration
│   │   ├── data/               # Modular seed datasets (55 exercises, 15 muscles, 6 plans)
│   │   └── seed.js
│   ├── test/
│   │   └── api.test.js         # Automated backend API & security integration tests
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── SECURITY.md
└── README.md
```

---

## 4. Running with Docker Compose (Recommended)

Build and start the PostgreSQL database, NestJS backend (auto-migrating & seeding), and Nginx React frontend with a single command:

```bash
docker compose up --build
```

Once running:
- **Frontend Application**: http://localhost:8080
- **Backend REST API**: http://localhost:4000/api/v1/health
- **Swagger / OpenAPI Documentation**: http://localhost:4000/api/docs

---

## 5. Local Development & Database Commands

### Backend Setup
```bash
cd backend
npm install

# Generate Prisma Client
npx prisma generate

# Apply PostgreSQL migrations (when local PostgreSQL is running)
npx prisma migrate deploy

# Seed the PostgreSQL database with 55 exercises, 15 muscles & 6 workout plans
npm run prisma:seed

# Start the NestJS backend on http://localhost:4000
npm start

# Run the automated API & Security integration test suite
npm test
```

### Frontend Setup
```bash
cd frontend
npm install

# Start Vite dev server on http://localhost:5173 (proxies /api to localhost:4000)
npm run dev

# Build production bundle
npm run build
```

---

## 6. REST API Endpoints Summary (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health check, uptime, and database counts |
| `GET` | `/api/v1/muscles` | List all 15 anatomical muscles (`?side=FRONT\|BACK`) |
| `GET` | `/api/v1/muscles/groups` | List all 10 muscle group categories with exercise counts |
| `GET` | `/api/v1/muscles/:id` | Detailed anatomical profile & exercises for a muscle |
| `GET` | `/api/v1/muscles/:id/exercises` | Primary, secondary & synergist exercises for a muscle |
| `GET` | `/api/v1/exercises` | Paginated & filtered exercises (`category`, `muscle`, `equipment`, `difficulty`, `type`, `q`, `sort`) |
| `GET` | `/api/v1/exercises/compare` | Side-by-side comparison (`?first=barbell-bench-press&second=dumbbell-bench-press`) |
| `GET` | `/api/v1/exercises/:id` | Full exercise instructions, mistakes, safety tips & similar exercises |
| `GET` | `/api/v1/equipment` | List all 12 equipment types with exercise counts |
| `GET` | `/api/v1/workout-plans` | List all 6 beginner workout plans |
| `GET` | `/api/v1/workout-plans/:id` | Full day-by-day workout schedule with clickable exercises |
| `GET` | `/api/v1/search?q=bench` | Global search across exercises, muscles, equipment, and plans |
| `POST` | `/api/v1/auth/register` | Register optional user account (HttpOnly cookie auth) |
| `POST` | `/api/v1/auth/login` | Authenticate user with brute-force lockout protection |
| `POST` | `/api/v1/auth/refresh` | Rotate short-lived access & refresh tokens |
| `POST` | `/api/v1/auth/logout` | Revoke session and clear HttpOnly cookies |
