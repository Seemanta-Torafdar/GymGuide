// ============================================================================
// GYMGUIDE - MUSCLES & MUSCLE GROUPS MODULE
// Endpoints:
//   GET /api/v1/muscles
//   GET /api/v1/muscles/groups
//   GET /api/v1/muscles/:id
//   GET /api/v1/muscles/:id/exercises
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
class MusclesService {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  async findAllMuscles(query = {}) {
    const allMuscles = await this.prisma.getAllMusclesFormatted();
    const allExercises = await this.prisma.getAllExercisesFormatted();
    const sideFilter = query.side ? sanitizeString(query.side, 16).toUpperCase() : null;
    const groupFilter = query.group ? sanitizeSlugOrId(query.group) : null;

    let filtered = allMuscles.map((muscle) => {
      const primaryExercises = allExercises.filter((ex) =>
        (ex.primaryMuscles || []).some((pm) => pm.slug === muscle.slug || pm.id === muscle.id)
      );
      const secondaryExercises = allExercises.filter((ex) =>
        (ex.secondaryMuscles || []).some((sm) => sm.slug === muscle.slug || sm.id === muscle.id)
      );

      return {
        id: muscle.id,
        slug: muscle.slug,
        name: muscle.name,
        scientificName: muscle.scientificName,
        bodySide: muscle.bodySide,
        svgRegionId: muscle.svgRegionId,
        shortDescription: muscle.shortDescription,
        anatomicalFunction: muscle.anatomicalFunction,
        trainingTip: muscle.trainingTip,
        muscleGroupId: muscle.muscleGroupId,
        muscleGroup: muscle.muscleGroup || null,
        stats: {
          primaryExerciseCount: primaryExercises.length,
          secondaryExerciseCount: secondaryExercises.length,
          totalExerciseCount: primaryExercises.length + secondaryExercises.length,
        },
      };
    });

    if (sideFilter && ['FRONT', 'BACK', 'BOTH'].includes(sideFilter)) {
      filtered = filtered.filter(
        (m) => m.bodySide === sideFilter || m.bodySide === 'BOTH'
      );
    }

    if (groupFilter) {
      filtered = filtered.filter(
        (m) =>
          (m.muscleGroup && m.muscleGroup.slug === groupFilter) ||
          m.muscleGroupId === groupFilter ||
          m.slug === groupFilter
      );
    }

    return filtered;
  }

  async findAllMuscleGroups() {
    const groups = await this.prisma.getAllMuscleGroupsFormatted();
    const allExercises = await this.prisma.getAllExercisesFormatted();

    return groups.map((group) => {
      const groupExercises = allExercises.filter(
        (ex) =>
          ex.muscleGroupId === group.id ||
          ex.category.toLowerCase() === group.name.toLowerCase()
      );
      return {
        ...group,
        exerciseCount: groupExercises.length,
      };
    });
  }

  async findMuscleByIdOrSlug(idOrSlug) {
    const cleanId = sanitizeSlugOrId(idOrSlug);
    const allMuscles = await this.findAllMuscles();

    let muscle = allMuscles.find(
      (m) =>
        m.id.toLowerCase() === cleanId ||
        m.slug.toLowerCase() === cleanId ||
        m.svgRegionId.toLowerCase() === cleanId
    );

    // Also allow matching by muscle group slug (e.g., "legs" -> "quadriceps", "back" -> "latissimus-dorsi", "abs" -> "rectus-abdominis", "shoulders" -> "front-deltoids")
    if (!muscle) {
      const groupAliases = {
        legs: 'quadriceps',
        back: 'latissimus-dorsi',
        abs: 'rectus-abdominis',
        shoulders: 'front-deltoids',
        arms: 'biceps',
        'calves-back': 'calves',
      };
      const mappedSlug = groupAliases[cleanId];
      if (mappedSlug) {
        muscle = allMuscles.find((m) => m.slug === mappedSlug);
      }
    }

    if (!muscle) {
      throw new NotFoundException(`Muscle '${cleanId}' not found.`);
    }

    const exercisesData = await this.findExercisesByMuscle(muscle.slug);

    return {
      ...muscle,
      primaryExercises: exercisesData.primaryExercises,
      secondaryExercises: exercisesData.secondaryExercises,
      synergistMuscles: exercisesData.synergistMuscles,
    };
  }

  async findExercisesByMuscle(idOrSlug, query = {}) {
    const cleanId = sanitizeSlugOrId(idOrSlug);
    const allMuscles = await this.prisma.getAllMusclesFormatted();
    const allExercises = await this.prisma.getAllExercisesFormatted();

    const groupAliases = {
      legs: 'quadriceps',
      back: 'latissimus-dorsi',
      abs: 'rectus-abdominis',
      shoulders: 'front-deltoids',
      'calves-back': 'calves',
    };
    const lookupSlug = groupAliases[cleanId] || cleanId;

    const muscle = allMuscles.find(
      (m) =>
        m.id.toLowerCase() === lookupSlug ||
        m.slug.toLowerCase() === lookupSlug ||
        m.svgRegionId.toLowerCase() === lookupSlug
    );

    if (!muscle) {
      throw new NotFoundException(`Muscle '${cleanId}' not found.`);
    }

    const roleFilter = query.role ? sanitizeString(query.role, 16).toUpperCase() : 'ALL';

    const primaryExercises = allExercises.filter((ex) =>
      (ex.primaryMuscles || []).some((pm) => pm.slug === muscle.slug || pm.id === muscle.id)
    );

    const secondaryExercises = allExercises.filter(
      (ex) =>
        !primaryExercises.some((p) => p.id === ex.id) &&
        (ex.secondaryMuscles || []).some((sm) => sm.slug === muscle.slug || sm.id === muscle.id)
    );

    // Determine synergistic secondary muscles frequently trained alongside this muscle
    const synergistMap = new Map();
    for (const ex of primaryExercises) {
      for (const sm of ex.secondaryMuscles || []) {
        if (sm.slug !== muscle.slug) {
          const existing = synergistMap.get(sm.slug) || { ...sm, coActivationCount: 0 };
          existing.coActivationCount += 1;
          synergistMap.set(sm.slug, existing);
        }
      }
    }

    const synergistMuscles = Array.from(synergistMap.values()).sort(
      (a, b) => b.coActivationCount - a.coActivationCount
    );

    let combined = [...primaryExercises, ...secondaryExercises];
    if (roleFilter === 'PRIMARY') {
      combined = primaryExercises;
    } else if (roleFilter === 'SECONDARY') {
      combined = secondaryExercises;
    }

    return {
      muscle: {
        id: muscle.id,
        slug: muscle.slug,
        name: muscle.name,
        scientificName: muscle.scientificName,
        bodySide: muscle.bodySide,
        svgRegionId: muscle.svgRegionId,
        shortDescription: muscle.shortDescription,
        anatomicalFunction: muscle.anatomicalFunction,
        trainingTip: muscle.trainingTip,
      },
      exercises: combined,
      primaryExercises,
      secondaryExercises,
      synergistMuscles,
    };
  }
}

@ApiTags('Muscles')
@Controller('muscles')
@Dependencies(MusclesService)
class MusclesController {
  constructor(musclesService) {
    this.musclesService = musclesService;
  }

  @Get()
  @Bind(Query())
  @ApiOperation({ summary: 'List all interactive anatomical muscles (Front & Back views)' })
  async findAll(query) {
    return this.musclesService.findAllMuscles(query);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List all 10 major exercise muscle group categories' })
  async findAllGroups() {
    return this.musclesService.findAllMuscleGroups();
  }

  @Get(':id/exercises')
  @Bind(Param('id'), Query())
  @ApiOperation({ summary: 'Get primary and secondary exercises targeting a specific muscle' })
  async findMuscleExercises(id, query) {
    return this.musclesService.findExercisesByMuscle(id, query);
  }

  @Get(':id')
  @Bind(Param('id'))
  @ApiOperation({ summary: 'Get detailed anatomical info and exercises for a specific muscle' })
  async findOne(id) {
    return this.musclesService.findMuscleByIdOrSlug(id);
  }
}

@Module({
  controllers: [MusclesController],
  providers: [MusclesService],
  exports: [MusclesService],
})
class MuscleGroupsModule {}

module.exports = {
  MusclesService,
  MusclesController,
  MuscleGroupsModule,
};
