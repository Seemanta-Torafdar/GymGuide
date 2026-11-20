-- ============================================================================
-- GYMGUIDE - INITIAL DATABASE MIGRATION (PostgreSQL)
-- Creates all 12 tables, enums, indexes, unique constraints, and foreign keys
-- ============================================================================

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
CREATE TYPE "ExerciseType" AS ENUM ('COMPOUND', 'ISOLATION', 'STABILITY');
CREATE TYPE "MuscleRole" AS ENUM ('PRIMARY', 'SECONDARY');
CREATE TYPE "BodySide" AS ENUM ('FRONT', 'BACK', 'BOTH');

-- 1. CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "refresh_token_hash" TEXT,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- 2. CreateTable: muscle_groups
CREATE TABLE "muscle_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body_region" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- 3. CreateTable: muscles
CREATE TABLE "muscles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scientific_name" TEXT NOT NULL,
    "body_side" "BodySide" NOT NULL,
    "svg_region_id" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "anatomical_function" TEXT NOT NULL,
    "training_tip" TEXT NOT NULL,
    "muscle_group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "muscles_pkey" PRIMARY KEY ("id")
);

-- 4. CreateTable: exercises
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "muscle_group_id" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "exercise_type" "ExerciseType" NOT NULL DEFAULT 'COMPOUND',
    "force_type" TEXT NOT NULL DEFAULT 'Push',
    "description" TEXT NOT NULL,
    "starting_position" TEXT NOT NULL,
    "recommended_sets" TEXT NOT NULL,
    "recommended_reps" TEXT NOT NULL,
    "rest_duration" TEXT NOT NULL,
    "common_mistakes" TEXT[],
    "safety_tips" TEXT[],
    "movement_differences" TEXT NOT NULL,
    "advantages" TEXT[],
    "limitations" TEXT[],
    "media_url" TEXT,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- 5. CreateTable: exercise_muscles
CREATE TABLE "exercise_muscles" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "muscle_id" TEXT NOT NULL,
    "role" "MuscleRole" NOT NULL DEFAULT 'PRIMARY',
    "activation_percent" INTEGER NOT NULL DEFAULT 85,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exercise_muscles_pkey" PRIMARY KEY ("id")
);

-- 6. CreateTable: equipment
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: exercise_equipment (M:N join table)
CREATE TABLE "exercise_equipment" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "equipment_id" TEXT NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "exercise_equipment_pkey" PRIMARY KEY ("id")
);

-- 7. CreateTable: exercise_instructions
CREATE TABLE "exercise_instructions" (
    "id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "coaching_cue" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exercise_instructions_pkey" PRIMARY KEY ("id")
);

-- 8. CreateTable: workout_plans
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "days_per_week" INTEGER NOT NULL,
    "session_duration_mins" INTEGER NOT NULL,
    "goal" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- 9. CreateTable: workout_plan_days
CREATE TABLE "workout_plan_days" (
    "id" TEXT NOT NULL,
    "workout_plan_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "day_label" TEXT NOT NULL,
    "focus_area" TEXT NOT NULL,
    "target_muscles" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workout_plan_days_pkey" PRIMARY KEY ("id")
);

-- 10. CreateTable: workout_plan_exercises
CREATE TABLE "workout_plan_exercises" (
    "id" TEXT NOT NULL,
    "workout_plan_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" TEXT NOT NULL,
    "rest_guidance" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "workout_plan_exercises_pkey" PRIMARY KEY ("id")
);

-- 11. CreateTable: user_favorites
CREATE TABLE "user_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id")
);

-- 12. CreateTable: workout_logs
CREATE TABLE "workout_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets_done" INTEGER NOT NULL,
    "reps_done" INTEGER NOT NULL,
    "weight_kg" DOUBLE PRECISION,
    "notes" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id")
);

-- Unique Constraints & Indexes
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE UNIQUE INDEX "muscle_groups_slug_key" ON "muscle_groups"("slug");
CREATE UNIQUE INDEX "muscle_groups_name_key" ON "muscle_groups"("name");
CREATE INDEX "muscle_groups_slug_idx" ON "muscle_groups"("slug");

CREATE UNIQUE INDEX "muscles_slug_key" ON "muscles"("slug");
CREATE UNIQUE INDEX "muscles_name_key" ON "muscles"("name");
CREATE INDEX "muscles_slug_idx" ON "muscles"("slug");
CREATE INDEX "muscles_muscle_group_id_idx" ON "muscles"("muscle_group_id");
CREATE INDEX "muscles_body_side_idx" ON "muscles"("body_side");

CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");
CREATE INDEX "exercises_slug_idx" ON "exercises"("slug");
CREATE INDEX "exercises_category_idx" ON "exercises"("category");
CREATE INDEX "exercises_muscle_group_id_idx" ON "exercises"("muscle_group_id");
CREATE INDEX "exercises_difficulty_idx" ON "exercises"("difficulty");
CREATE INDEX "exercises_exercise_type_idx" ON "exercises"("exercise_type");

CREATE UNIQUE INDEX "exercise_muscles_exercise_id_muscle_id_key" ON "exercise_muscles"("exercise_id", "muscle_id");
CREATE INDEX "exercise_muscles_exercise_id_idx" ON "exercise_muscles"("exercise_id");
CREATE INDEX "exercise_muscles_muscle_id_idx" ON "exercise_muscles"("muscle_id");
CREATE INDEX "exercise_muscles_role_idx" ON "exercise_muscles"("role");

CREATE UNIQUE INDEX "equipment_slug_key" ON "equipment"("slug");
CREATE UNIQUE INDEX "equipment_name_key" ON "equipment"("name");
CREATE INDEX "equipment_slug_idx" ON "equipment"("slug");

CREATE UNIQUE INDEX "exercise_equipment_exercise_id_equipment_id_key" ON "exercise_equipment"("exercise_id", "equipment_id");
CREATE INDEX "exercise_equipment_exercise_id_idx" ON "exercise_equipment"("exercise_id");
CREATE INDEX "exercise_equipment_equipment_id_idx" ON "exercise_equipment"("equipment_id");

CREATE UNIQUE INDEX "exercise_instructions_exercise_id_step_number_key" ON "exercise_instructions"("exercise_id", "step_number");
CREATE INDEX "exercise_instructions_exercise_id_idx" ON "exercise_instructions"("exercise_id");

CREATE UNIQUE INDEX "workout_plans_slug_key" ON "workout_plans"("slug");
CREATE UNIQUE INDEX "workout_plans_name_key" ON "workout_plans"("name");
CREATE INDEX "workout_plans_slug_idx" ON "workout_plans"("slug");
CREATE INDEX "workout_plans_days_per_week_idx" ON "workout_plans"("days_per_week");

CREATE UNIQUE INDEX "workout_plan_days_workout_plan_id_day_number_key" ON "workout_plan_days"("workout_plan_id", "day_number");
CREATE INDEX "workout_plan_days_workout_plan_id_idx" ON "workout_plan_days"("workout_plan_id");

CREATE UNIQUE INDEX "workout_plan_exercises_workout_plan_day_id_order_index_key" ON "workout_plan_exercises"("workout_plan_day_id", "order_index");
CREATE INDEX "workout_plan_exercises_workout_plan_day_id_idx" ON "workout_plan_exercises"("workout_plan_day_id");
CREATE INDEX "workout_plan_exercises_exercise_id_idx" ON "workout_plan_exercises"("exercise_id");

CREATE UNIQUE INDEX "user_favorites_user_id_exercise_id_key" ON "user_favorites"("user_id", "exercise_id");
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites"("user_id");
CREATE INDEX "user_favorites_exercise_id_idx" ON "user_favorites"("exercise_id");

CREATE INDEX "workout_logs_user_id_idx" ON "workout_logs"("user_id");
CREATE INDEX "workout_logs_exercise_id_idx" ON "workout_logs"("exercise_id");
CREATE INDEX "workout_logs_performed_at_idx" ON "workout_logs"("performed_at");

-- Foreign Key Constraints
ALTER TABLE "muscles" ADD CONSTRAINT "muscles_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "muscle_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_muscle_group_id_fkey" FOREIGN KEY ("muscle_group_id") REFERENCES "muscle_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_muscles" ADD CONSTRAINT "exercise_muscles_muscle_id_fkey" FOREIGN KEY ("muscle_id") REFERENCES "muscles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_equipment" ADD CONSTRAINT "exercise_equipment_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercise_instructions" ADD CONSTRAINT "exercise_instructions_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_plan_days" ADD CONSTRAINT "workout_plan_days_workout_plan_id_fkey" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_workout_plan_day_id_fkey" FOREIGN KEY ("workout_plan_day_id") REFERENCES "workout_plan_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_plan_exercises" ADD CONSTRAINT "workout_plan_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
