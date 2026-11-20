// ============================================================================
// GYMGUIDE - SEARCH MODULE (GET /api/v1/search?q=...)
// Searches across Exercises, Anatomical Muscles, Equipment, Categories & Plans
// ============================================================================

const {
  Injectable,
  Controller,
  Get,
  Query,
  Bind,
  Dependencies,
  Module,
} = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const { PrismaService } = require('../../database/prisma.service');
const { sanitizeString } = require('../../common/sanitize.util');

@Injectable()
@Dependencies(PrismaService)
class SearchService {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  async searchAll(rawQuery = '') {
    const q = sanitizeString(rawQuery, 100).toLowerCase();
    const allExercises = await this.prisma.getAllExercisesFormatted();
    const allMuscles = await this.prisma.getAllMusclesFormatted();
    const allEquipment = await this.prisma.getAllEquipmentFormatted();
    const allPlans = await this.prisma.getAllWorkoutPlansFormatted();

    if (!q) {
      return {
        query: '',
        totalMatches: allExercises.length,
        exercises: allExercises.slice(0, 12),
        muscles: allMuscles.slice(0, 6),
        equipment: allEquipment.slice(0, 6),
        workoutPlans: allPlans.slice(0, 3),
      };
    }

    const terms = q.split(/\s+/).filter(Boolean);

    // Score and match exercises by name, muscle name, equipment, or category
    const scoredExercises = allExercises
      .map((ex) => {
        let score = 0;
        const nameLower = ex.name.toLowerCase();
        const catLower = ex.category.toLowerCase();
        const descLower = ex.description.toLowerCase();
        const primaryNames = (ex.primaryMuscles || [])
          .map((m) => `${m.name} ${m.scientificName} ${m.slug}`)
          .join(' ')
          .toLowerCase();
        const secondaryNames = (ex.secondaryMuscles || [])
          .map((m) => `${m.name} ${m.scientificName} ${m.slug}`)
          .join(' ')
          .toLowerCase();
        const eqNames = (ex.equipment || [])
          .map((e) => `${e.name} ${e.slug} ${e.category}`)
          .join(' ')
          .toLowerCase();

        if (nameLower === q) score += 100;
        if (nameLower.includes(q)) score += 60;
        if (catLower === q || catLower.includes(q)) score += 55;
        if (primaryNames.includes(q)) score += 50;
        if (eqNames.includes(q)) score += 45;
        if (secondaryNames.includes(q)) score += 25;
        if (descLower.includes(q)) score += 15;

        // Multi-word matching
        const allText = `${nameLower} ${catLower} ${primaryNames} ${secondaryNames} ${eqNames} ${descLower}`;
        const matchesAllTerms = terms.every((t) => allText.includes(t));
        if (matchesAllTerms && score === 0) {
          score += 30;
        }

        return { exercise: ex, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
      .map((item) => item.exercise);

    const matchedMuscles = allMuscles.filter((m) => {
      const text = `${m.name} ${m.scientificName} ${m.slug} ${m.shortDescription}`.toLowerCase();
      return text.includes(q) || terms.every((t) => text.includes(t));
    });

    const matchedEquipment = allEquipment.filter((eq) => {
      const text = `${eq.name} ${eq.slug} ${eq.category} ${eq.description}`.toLowerCase();
      return text.includes(q) || terms.every((t) => text.includes(t));
    });

    const matchedPlans = allPlans.filter((wp) => {
      const text = `${wp.name} ${wp.subtitle} ${wp.description} ${wp.goal}`.toLowerCase();
      return text.includes(q) || terms.every((t) => text.includes(t));
    });

    return {
      query: q,
      totalMatches:
        scoredExercises.length +
        matchedMuscles.length +
        matchedEquipment.length +
        matchedPlans.length,
      exercises: scoredExercises,
      muscles: matchedMuscles,
      equipment: matchedEquipment,
      workoutPlans: matchedPlans,
    };
  }
}

@ApiTags('Search')
@Controller('search')
@Dependencies(SearchService)
class SearchController {
  constructor(searchService) {
    this.searchService = searchService;
  }

  @Get()
  @Bind(Query())
  @ApiOperation({
    summary: 'Search across exercise names, target muscles, equipment, and categories',
  })
  async search(query) {
    return this.searchService.searchAll(query.q || '');
  }
}

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
class SearchModule {}

module.exports = {
  SearchService,
  SearchController,
  SearchModule,
};
