// ============================================================================
// GYMGUIDE - WORKOUT PLANS MODULE
// Endpoints:
//   GET /api/v1/workout-plans
//   GET /api/v1/workout-plans/:id
// ============================================================================

const {
  Injectable,
  Controller,
  Get,
  Param,
  Query,
  Bind,
  Dependencies,
  NotFoundException,
  Module,
} = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const { PrismaService } = require('../../database/prisma.service');
const { sanitizeSlugOrId, sanitizeString } = require('../../common/sanitize.util');

@Injectable()
@Dependencies(PrismaService)
class WorkoutPlansService {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  _normalizePlan(plan) {
    if (!plan) return null;
    const days = (plan.days || []).map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      dayLabel: day.dayLabel,
      focusArea: day.focusArea,
      targetMuscles: day.targetMuscles || [],
      notes: day.notes || null,
      exercises: (day.exercises || []).map((item) => {
        const formattedEx = item.exercise
          ? this.prisma.formatPrismaExercise(item.exercise)
          : null;
        return {
          id: item.id,
          orderIndex: item.orderIndex,
          sets: item.sets,
          reps: item.reps,
          restGuidance: item.restGuidance,
          notes: item.notes || null,
          exercise: formattedEx
            ? {
                id: formattedEx.id,
                slug: formattedEx.slug,
                name: formattedEx.name,
                category: formattedEx.category,
                difficulty: formattedEx.difficulty,
                exerciseType: formattedEx.exerciseType,
                primaryMuscles: formattedEx.primaryMuscles,
                equipment: formattedEx.equipment,
              }
            : null,
        };
      }),
    }));

    const totalExercisesCount = days.reduce(
      (sum, d) => sum + (d.exercises ? d.exercises.length : 0),
      0
    );

    return {
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
      totalExercisesCount,
      days,
    };
  }

  async findAll(query = {}) {
    const rawPlans = await this.prisma.getAllWorkoutPlansFormatted();
    let plans = rawPlans.map((p) => this._normalizePlan(p));

    if (query.days) {
      const daysNum = parseInt(query.days, 10);
      if (!Number.isNaN(daysNum)) {
        plans = plans.filter((p) => p.daysPerWeek === daysNum);
      }
    }

    if (query.difficulty) {
      const diff = sanitizeString(query.difficulty, 24).toUpperCase();
      if (diff !== 'ALL') {
        plans = plans.filter((p) => p.difficulty === diff);
      }
    }

    return plans;
  }

  async findByIdOrSlug(idOrSlug) {
    const cleanId = sanitizeSlugOrId(idOrSlug);
    const plans = await this.findAll();

    const plan = plans.find(
      (p) => p.id.toLowerCase() === cleanId || p.slug.toLowerCase() === cleanId
    );

    if (!plan) {
      throw new NotFoundException(`Workout plan '${cleanId}' not found.`);
    }

    return plan;
  }
}

@ApiTags('Workout Plans')
@Controller('workout-plans')
@Dependencies(WorkoutPlansService)
class WorkoutPlansController {
  constructor(workoutPlansService) {
    this.workoutPlansService = workoutPlansService;
  }

  @Get()
  @Bind(Query())
  @ApiOperation({ summary: 'List all 6 beginner workout plans with schedule & exercises' })
  async findAll(query) {
    return this.workoutPlansService.findAll(query);
  }

  @Get(':id')
  @Bind(Param('id'))
  @ApiOperation({ summary: 'Get a specific workout plan by ID or slug' })
  async findOne(id) {
    return this.workoutPlansService.findByIdOrSlug(id);
  }
}

@Module({
  controllers: [WorkoutPlansController],
  providers: [WorkoutPlansService],
  exports: [WorkoutPlansService],
})
class WorkoutPlansModule {}

module.exports = {
  WorkoutPlansService,
  WorkoutPlansController,
  WorkoutPlansModule,
};
