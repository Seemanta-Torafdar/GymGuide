// ============================================================================
// GYMGUIDE - PRISMA DATABASE SERVICE
// Connects to PostgreSQL via Prisma ORM and provides resilient seed hydration
// if PostgreSQL daemon is offline during local standalone development/testing.
// ============================================================================

const net = require('net');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Injectable } = require('@nestjs/common');
const { PrismaClient } = require('@prisma/client');
const {
  MUSCLE_GROUPS,
  MUSCLES,
  EQUIPMENT,
  ALL_EXERCISES,
  WORKOUT_PLANS,
} = require('../../prisma/seed');
const { buildFourStepInstructions } = require('../common/four-step-sequence.util');

const FALLBACK_MEDIA_METADATA_FILE = path.resolve(
  process.cwd(),
  'prisma',
  'data',
  'media-metadata.json'
);

function loadFallbackMediaMetadata() {
  try {
    if (fs.existsSync(FALLBACK_MEDIA_METADATA_FILE)) {
      const raw = fs.readFileSync(FALLBACK_MEDIA_METADATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (_) {}
  return [];
}

function probeTcpReachable(databaseUrl, timeoutMs = 180) {
  return new Promise((resolve) => {
    let host = '127.0.0.1';
    let port = 5432;
    try {
      const parsed = new URL(databaseUrl || '');
      if (parsed.hostname) host = parsed.hostname === 'localhost' ? '127.0.0.1' : parsed.hostname;
      if (parsed.port) port = parseInt(parsed.port, 10) || 5432;
    } catch (_) {}

    const socket = new net.Socket();
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

@Injectable()
class PrismaService {
  constructor() {
    this.isPostgresConnected = false;
    this.mode = 'initializing';
    this.client = null;
    this.memoryStore = this._buildNormalizedMemoryStore();
  }

  async onModuleInit() {
    await this._seedFallbackUsers();

    if (process.env.FORCE_SEED_STORE === 'true') {
      this.mode = 'seed-relational-store';
      return;
    }

    try {
      const reachable = await probeTcpReachable(process.env.DATABASE_URL, 180);
      if (!reachable) {
        throw new Error('PostgreSQL port unavailable (fast fallback)');
      }

      this.client = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
      await Promise.race([
        this.client.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PostgreSQL connection timeout (2500ms)')), 2500)
        ),
      ]);
      // Verify tables exist
      const count = await this.client.exercise.count();
      this.isPostgresConnected = true;
      this.mode = 'postgresql';
      console.log(`✅ Connected to PostgreSQL database via Prisma ORM (${count} exercises loaded).`);
    } catch (err) {
      this.isPostgresConnected = false;
      this.mode = 'seed-relational-store';
      if (this.client) {
        try {
          await this.client.$disconnect();
        } catch (_) {}
      }
      console.log(
        `ℹ️ PostgreSQL daemon not reachable at current DATABASE_URL (${err.message}). Running with synchronized relational seed store (${this.memoryStore.exercises.length} exercises, ${this.memoryStore.muscles.length} muscles, ${this.memoryStore.workoutPlans.length} workout plans).`
      );
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isPostgresConnected) {
      await this.client.$disconnect();
    }
  }

  _buildNormalizedMemoryStore() {
    const muscleGroupById = new Map(MUSCLE_GROUPS.map((mg) => [mg.id, { ...mg }]));
    const muscleBySlug = new Map(
      MUSCLES.map((m) => [
        m.slug,
        {
          ...m,
          muscleGroup: muscleGroupById.get(m.muscleGroupId) || null,
        },
      ])
    );
    const muscleById = new Map(
      Array.from(muscleBySlug.values()).map((m) => [m.id, m])
    );
    const equipmentBySlug = new Map(EQUIPMENT.map((eq) => [eq.slug, { ...eq }]));

    const hydratedExercises = ALL_EXERCISES.map((ex) => {
      const muscleGroup = muscleGroupById.get(ex.muscleGroupId) || null;
      const primaryMuscles = (ex.primaryMuscles || [])
        .map((pm) => {
          const muscle = muscleBySlug.get(pm.muscleSlug);
          return muscle
            ? {
                role: 'PRIMARY',
                activationPercent: pm.activation || 90,
                muscle,
              }
            : null;
        })
        .filter(Boolean);

      const secondaryMuscles = (ex.secondaryMuscles || [])
        .map((sm) => {
          const muscle = muscleBySlug.get(sm.muscleSlug);
          return muscle
            ? {
                role: 'SECONDARY',
                activationPercent: sm.activation || 60,
                muscle,
              }
            : null;
        })
        .filter(Boolean);

      const equipmentList = (ex.equipmentSlugs || [])
        .map((slug) => equipmentBySlug.get(slug))
        .filter(Boolean);

      const formattedPrimary = primaryMuscles.map((item) => ({
        ...item.muscle,
        activationPercent: item.activationPercent,
      }));
      const formattedSecondary = secondaryMuscles.map((item) => ({
        ...item.muscle,
        activationPercent: item.activationPercent,
      }));

      return {
        ...ex,
        muscleGroup,
        exerciseMuscles: [...primaryMuscles, ...secondaryMuscles],
        primaryMuscles: formattedPrimary,
        secondaryMuscles: formattedSecondary,
        equipment: equipmentList,
        instructions: buildFourStepInstructions({
          ...ex,
          primaryMuscles: formattedPrimary,
          secondaryMuscles: formattedSecondary,
          equipment: equipmentList,
        }),
      };
    });

    const exerciseBySlug = new Map(hydratedExercises.map((e) => [e.slug, e]));

    const hydratedWorkoutPlans = WORKOUT_PLANS.map((plan) => ({
      ...plan,
      days: (plan.days || []).map((day, idx) => ({
        id: `${plan.id}-day-${day.dayNumber || idx + 1}`,
        workoutPlanId: plan.id,
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        focusArea: day.focusArea,
        targetMuscles: day.targetMuscles,
        notes: day.notes || null,
        exercises: (day.exercises || []).map((item) => {
          const ex = exerciseBySlug.get(item.exerciseSlug);
          return {
            id: `${plan.id}-d${day.dayNumber}-e${item.orderIndex}`,
            orderIndex: item.orderIndex,
            sets: item.sets,
            reps: item.reps,
            restGuidance: item.restGuidance,
            notes: item.notes || null,
            exercise: ex
              ? {
                  id: ex.id,
                  slug: ex.slug,
                  name: ex.name,
                  category: ex.category,
                  difficulty: ex.difficulty,
                  exerciseType: ex.exerciseType,
                  primaryMuscles: ex.primaryMuscles,
                  equipment: ex.equipment,
                }
              : null,
          };
        }),
      })),
    }));

    return {
      muscleGroups: MUSCLE_GROUPS,
      muscles: Array.from(muscleById.values()),
      equipment: EQUIPMENT,
      exercises: hydratedExercises,
      workoutPlans: hydratedWorkoutPlans,
      exerciseMedia: loadFallbackMediaMetadata(),
      users: new Map(),
      favorites: new Map(),
      workoutLogs: [],
    };
  }

  saveFallbackMediaMetadata() {
    try {
      const dir = path.dirname(FALLBACK_MEDIA_METADATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        FALLBACK_MEDIA_METADATA_FILE,
        JSON.stringify(this.memoryStore.exerciseMedia, null, 2),
        'utf8'
      );
    } catch (err) {
      console.warn('Could not persist fallback media-metadata.json:', err.message);
    }
  }

  async _seedFallbackUsers() {
    const demoEmail = 'learner@gymguide.local';
    if (!this.memoryStore.users.has(demoEmail)) {
      const demoHash = await bcrypt.hash('GymGuideLearner#2026', 10);
      this.memoryStore.users.set(demoEmail, {
        id: 'usr-demo-learner',
        email: demoEmail,
        passwordHash: demoHash,
        displayName: 'Alex Mercer (Beginner Athlete)',
        role: 'USER',
        refreshTokenHash: null,
        failedLoginCount: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const adminEmail = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || '';
    if (
      adminEmail &&
      adminPassword &&
      !adminPassword.includes('CHANGE_ME') &&
      !adminPassword.includes('__INJECT_VIA_SECRET_MANAGER__') &&
      !this.memoryStore.users.has(adminEmail)
    ) {
      const adminHash = await bcrypt.hash(adminPassword, 10);
      this.memoryStore.users.set(adminEmail, {
        id: 'usr-admin-studio',
        email: adminEmail,
        passwordHash: adminHash,
        displayName: 'GymGuide Admin',
        role: 'ADMIN',
        refreshTokenHash: null,
        failedLoginCount: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Formats a raw Prisma Exercise record with nested relations into the clean API DTO format
   */
  formatPrismaExercise(record) {
    if (!record) return null;
    if (record.primaryMuscles && Array.isArray(record.primaryMuscles) && record.equipment) {
      return record;
    }

    const primaryMuscles = [];
    const secondaryMuscles = [];

    for (const em of record.exerciseMuscles || []) {
      if (!em.muscle) continue;
      const formattedMuscle = {
        id: em.muscle.id,
        slug: em.muscle.slug,
        name: em.muscle.name,
        scientificName: em.muscle.scientificName,
        bodySide: em.muscle.bodySide,
        svgRegionId: em.muscle.svgRegionId,
        activationPercent: em.activationPercent,
      };
      if (em.role === 'PRIMARY') {
        primaryMuscles.push(formattedMuscle);
      } else {
        secondaryMuscles.push(formattedMuscle);
      }
    }

    const equipment = (record.exerciseEquipment || [])
      .map((ee) => ee.equipment)
      .filter(Boolean);

    const instructions = [...(record.instructions || [])].sort(
      (a, b) => a.stepNumber - b.stepNumber
    );

    return {
      id: record.id,
      slug: record.slug,
      name: record.name,
      category: record.category,
      muscleGroupId: record.muscleGroupId,
      muscleGroup: record.muscleGroup || null,
      difficulty: record.difficulty,
      exerciseType: record.exerciseType,
      forceType: record.forceType,
      description: record.description,
      startingPosition: record.startingPosition,
      recommendedSets: record.recommendedSets,
      recommendedReps: record.recommendedReps,
      restDuration: record.restDuration,
      commonMistakes: record.commonMistakes || [],
      safetyTips: record.safetyTips || [],
      movementDifferences: record.movementDifferences,
      advantages: record.advantages || [],
      limitations: record.limitations || [],
      isPopular: Boolean(record.isPopular),
      primaryMuscles,
      secondaryMuscles,
      equipment,
      instructions,
      mediaItems: Array.isArray(record.mediaItems) ? record.mediaItems : [],
    };
  }

  async getAllExercisesFormatted() {
    if (this.isPostgresConnected && this.client) {
      const rows = await this.client.exercise.findMany({
        include: {
          muscleGroup: true,
          exerciseMuscles: { include: { muscle: true } },
          exerciseEquipment: { include: { equipment: true } },
          instructions: { orderBy: { stepNumber: 'asc' } },
          mediaItems: { orderBy: [{ mediaType: 'asc' }, { stepNumber: 'asc' }, { createdAt: 'asc' }] },
        },
        orderBy: { name: 'asc' },
      });
      return rows.map((r) => this.formatPrismaExercise(r));
    }
    return this.memoryStore.exercises;
  }

  async getAllMusclesFormatted() {
    if (this.isPostgresConnected && this.client) {
      const muscles = await this.client.muscle.findMany({
        include: {
          muscleGroup: true,
          exerciseMuscles: {
            include: {
              exercise: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      return muscles;
    }
    return this.memoryStore.muscles;
  }

  async getAllMuscleGroupsFormatted() {
    if (this.isPostgresConnected && this.client) {
      return this.client.muscleGroup.findMany({
        include: { muscles: true },
        orderBy: { displayOrder: 'asc' },
      });
    }
    return this.memoryStore.muscleGroups.map((mg) => ({
      ...mg,
      muscles: this.memoryStore.muscles.filter((m) => m.muscleGroupId === mg.id),
    }));
  }

  async getAllEquipmentFormatted() {
    if (this.isPostgresConnected && this.client) {
      return this.client.equipment.findMany({
        orderBy: { name: 'asc' },
      });
    }
    return this.memoryStore.equipment;
  }

  async getAllWorkoutPlansFormatted() {
    if (this.isPostgresConnected && this.client) {
      return this.client.workoutPlan.findMany({
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              exercises: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  exercise: {
                    include: {
                      exerciseMuscles: { include: { muscle: true } },
                      exerciseEquipment: { include: { equipment: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { daysPerWeek: 'asc' },
      });
    }
    return this.memoryStore.workoutPlans;
  }
}

module.exports = {
  PrismaService,
};
