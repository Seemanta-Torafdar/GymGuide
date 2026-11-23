// ============================================================================
// GYMGUIDE - DATABASE SEEDER (PostgreSQL via Prisma Client)
// Populates all 10 Muscle Groups, 15 Anatomical Muscles, 12 Equipment items,
// 55 Authentic Gym Exercises (with Muscles, Equipment, Instructions),
// and 6 Complete Beginner Workout Plans.
// ============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { MUSCLE_GROUPS, MUSCLES, EQUIPMENT } = require('./data/muscles-equipment');
const { UPPER_BODY_EXERCISES } = require('./data/exercises-upper');
const { LOWER_CORE_EXERCISES } = require('./data/exercises-lower-core');
const fs = require('fs');
const path = require('path');
const { WORKOUT_PLANS } = require('./data/workout-plans');
const distFourStepPath = path.resolve(__dirname, '../dist/common/four-step-sequence.util.js');
const srcFourStepPath = path.resolve(__dirname, '../src/common/four-step-sequence.util.js');
const { buildFourStepInstructions } = require(
  fs.existsSync(srcFourStepPath) ? srcFourStepPath : distFourStepPath
);

const ALL_EXERCISES = [...UPPER_BODY_EXERCISES, ...LOWER_CORE_EXERCISES];

async function seedDatabase(prismaClient) {
  const prisma = prismaClient || new PrismaClient();
  console.log('🌱 Starting GymGuide PostgreSQL database seed...');

  try {
    // 1. Upsert Muscle Groups
    for (const mg of MUSCLE_GROUPS) {
      await prisma.muscleGroup.upsert({
        where: { slug: mg.slug },
        update: {
          name: mg.name,
          description: mg.description,
          bodyRegion: mg.bodyRegion,
          displayOrder: mg.displayOrder,
        },
        create: mg,
      });
    }
    console.log(`✅ Seeded ${MUSCLE_GROUPS.length} muscle groups.`);

    // 2. Upsert Anatomical Muscles
    const muscleSlugToId = {};
    for (const m of MUSCLES) {
      const record = await prisma.muscle.upsert({
        where: { slug: m.slug },
        update: {
          name: m.name,
          scientificName: m.scientificName,
          bodySide: m.bodySide,
          svgRegionId: m.svgRegionId,
          shortDescription: m.shortDescription,
          anatomicalFunction: m.anatomicalFunction,
          trainingTip: m.trainingTip,
          muscleGroupId: m.muscleGroupId,
        },
        create: m,
      });
      muscleSlugToId[m.slug] = record.id;
    }
    console.log(`✅ Seeded ${MUSCLES.length} anatomical muscles.`);

    // 3. Upsert Equipment
    const equipmentSlugToId = {};
    for (const eq of EQUIPMENT) {
      const record = await prisma.equipment.upsert({
        where: { slug: eq.slug },
        update: {
          name: eq.name,
          category: eq.category,
          description: eq.description,
        },
        create: eq,
      });
      equipmentSlugToId[eq.slug] = record.id;
    }
    console.log(`✅ Seeded ${EQUIPMENT.length} equipment items.`);

    // 4. Upsert Exercises + ExerciseMuscles + ExerciseEquipment + ExerciseInstructions
    const exerciseSlugToId = {};
    for (const ex of ALL_EXERCISES) {
      const exRecord = await prisma.exercise.upsert({
        where: { slug: ex.slug },
        update: {
          name: ex.name,
          category: ex.category,
          muscleGroupId: ex.muscleGroupId,
          difficulty: ex.difficulty,
          exerciseType: ex.exerciseType,
          forceType: ex.forceType,
          description: ex.description,
          startingPosition: ex.startingPosition,
          recommendedSets: ex.recommendedSets,
          recommendedReps: ex.recommendedReps,
          restDuration: ex.restDuration,
          commonMistakes: ex.commonMistakes,
          safetyTips: ex.safetyTips,
          movementDifferences: ex.movementDifferences,
          advantages: ex.advantages,
          limitations: ex.limitations,
          isPopular: Boolean(ex.isPopular),
        },
        create: {
          id: ex.id,
          slug: ex.slug,
          name: ex.name,
          category: ex.category,
          muscleGroupId: ex.muscleGroupId,
          difficulty: ex.difficulty,
          exerciseType: ex.exerciseType,
          forceType: ex.forceType,
          description: ex.description,
          startingPosition: ex.startingPosition,
          recommendedSets: ex.recommendedSets,
          recommendedReps: ex.recommendedReps,
          restDuration: ex.restDuration,
          commonMistakes: ex.commonMistakes,
          safetyTips: ex.safetyTips,
          movementDifferences: ex.movementDifferences,
          advantages: ex.advantages,
          limitations: ex.limitations,
          isPopular: Boolean(ex.isPopular),
        },
      });
      exerciseSlugToId[ex.slug] = exRecord.id;

      // Clear and re-seed child relations for idempotency
      await prisma.exerciseMuscle.deleteMany({ where: { exerciseId: exRecord.id } });
      await prisma.exerciseEquipment.deleteMany({ where: { exerciseId: exRecord.id } });
      await prisma.exerciseInstruction.deleteMany({ where: { exerciseId: exRecord.id } });

      for (const pm of ex.primaryMuscles || []) {
        const muscleId = muscleSlugToId[pm.muscleSlug];
        if (muscleId) {
          await prisma.exerciseMuscle.create({
            data: {
              exerciseId: exRecord.id,
              muscleId,
              role: 'PRIMARY',
              activationPercent: pm.activation || 90,
            },
          });
        }
      }

      for (const sm of ex.secondaryMuscles || []) {
        const muscleId = muscleSlugToId[sm.muscleSlug];
        if (muscleId) {
          await prisma.exerciseMuscle.create({
            data: {
              exerciseId: exRecord.id,
              muscleId,
              role: 'SECONDARY',
              activationPercent: sm.activation || 60,
            },
          });
        }
      }

      for (const eqSlug of ex.equipmentSlugs || []) {
        const equipmentId = equipmentSlugToId[eqSlug];
        if (equipmentId) {
          await prisma.exerciseEquipment.create({
            data: {
              exerciseId: exRecord.id,
              equipmentId,
              isOptional: false,
            },
          });
        }
      }

      const fourSteps = buildFourStepInstructions({
        ...ex,
        primaryMuscles: (ex.primaryMuscles || []).map((pm) => ({
          name: MUSCLES.find((m) => m.slug === pm.muscleSlug)?.name || pm.muscleSlug,
          bodySide: MUSCLES.find((m) => m.slug === pm.muscleSlug)?.bodySide || 'FRONT',
        })),
        secondaryMuscles: (ex.secondaryMuscles || []).map((sm) => ({
          name: MUSCLES.find((m) => m.slug === sm.muscleSlug)?.name || sm.muscleSlug,
        })),
        equipment: (ex.equipmentSlugs || []).map((eqSlug) => ({
          name: EQUIPMENT.find((eq) => eq.slug === eqSlug)?.name || eqSlug,
        })),
      });

      for (const step of fourSteps) {
        await prisma.exerciseInstruction.create({
          data: {
            exerciseId: exRecord.id,
            stepNumber: step.stepNumber,
            title: step.title,
            instruction: step.instruction,
            coachingCue: step.coachingCue || null,
          },
        });
      }
    }
    console.log(`✅ Seeded ${ALL_EXERCISES.length} complete exercises with instructions, muscles & equipment.`);

    // 5. Upsert Workout Plans + Days + WorkoutPlanExercises
    for (const plan of WORKOUT_PLANS) {
      const planRecord = await prisma.workoutPlan.upsert({
        where: { slug: plan.slug },
        update: {
          name: plan.name,
          subtitle: plan.subtitle,
          description: plan.description,
          difficulty: plan.difficulty,
          daysPerWeek: plan.daysPerWeek,
          sessionDurationMins: plan.sessionDurationMins,
          goal: plan.goal,
          targetAudience: plan.targetAudience,
        },
        create: {
          id: plan.id,
          slug: plan.slug,
          name: plan.name,
          subtitle: plan.subtitle,
          description: plan.description,
          difficulty: plan.difficulty,
          daysPerWeek: plan.daysPerWeek,
          sessionDurationMins: plan.sessionDurationMins,
          goal: plan.goal,
          targetAudience: plan.targetAudience,
        },
      });

      await prisma.workoutPlanDay.deleteMany({ where: { workoutPlanId: planRecord.id } });

      for (const day of plan.days) {
        const dayRecord = await prisma.workoutPlanDay.create({
          data: {
            workoutPlanId: planRecord.id,
            dayNumber: day.dayNumber,
            dayLabel: day.dayLabel,
            focusArea: day.focusArea,
            targetMuscles: day.targetMuscles,
            notes: day.notes || null,
          },
        });

        for (const item of day.exercises) {
          const exerciseId = exerciseSlugToId[item.exerciseSlug];
          if (exerciseId) {
            await prisma.workoutPlanExercise.create({
              data: {
                workoutPlanDayId: dayRecord.id,
                exerciseId,
                orderIndex: item.orderIndex,
                sets: item.sets,
                reps: item.reps,
                restGuidance: item.restGuidance,
                notes: item.notes || null,
              },
            });
          }
        }
      }
    }
    console.log(`✅ Seeded ${WORKOUT_PLANS.length} structured beginner workout plans.`);

    // 6. Seed Default Demo User (Optional User Auth) & Configured Admin Account
    const demoPasswordHash = await bcrypt.hash('GymGuideLearner#2026', 12);
    await prisma.user.upsert({
      where: { email: 'learner@gymguide.local' },
      update: {},
      create: {
        id: 'usr-demo-learner',
        email: 'learner@gymguide.local',
        passwordHash: demoPasswordHash,
        displayName: 'Alex Mercer (Beginner Athlete)',
        role: 'USER',
      },
    });

    const seedAdminEmail = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
    const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || '';
    if (seedAdminEmail && seedAdminPassword && !seedAdminPassword.includes('CHANGE_ME') && !seedAdminPassword.includes('__INJECT_VIA_SECRET_MANAGER__')) {
      const adminHash = await bcrypt.hash(seedAdminPassword, 12);
      await prisma.user.upsert({
        where: { email: seedAdminEmail },
        update: {
          passwordHash: adminHash,
          role: 'ADMIN',
        },
        create: {
          id: 'usr-admin-studio',
          email: seedAdminEmail,
          passwordHash: adminHash,
          displayName: 'GymGuide Admin',
          role: 'ADMIN',
        },
      });
      console.log(`✅ Seeded Admin studio account (${seedAdminEmail}).`);
    }
    console.log('🎉 GymGuide database seed completed successfully!');
  } finally {
    if (!prismaClient) {
      await prisma.$disconnect();
    }
  }
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('❌ Database seed failed:', err);
    process.exit(1);
  });
}

module.exports = {
  seedDatabase,
  MUSCLE_GROUPS,
  MUSCLES,
  EQUIPMENT,
  ALL_EXERCISES,
  WORKOUT_PLANS,
};
