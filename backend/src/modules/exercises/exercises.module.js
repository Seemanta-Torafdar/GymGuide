// ============================================================================
// GYMGUIDE - EXERCISES & ADMIN VIDEO MANAGEMENT MODULE
// Endpoints:
//   GET    /api/v1/exercises
//   GET    /api/v1/exercises/compare?first=...&second=...
//   GET    /api/v1/exercises/:id
//   PUT    /api/v1/exercises/:id/video       (Admin: attach/update Front & Side video URLs)
//   POST   /api/v1/exercises/:id/video-file  (Admin: upload MP4/WebM/GIF video file)
//   DELETE /api/v1/exercises/:id/video       (Admin: remove custom video from exercise)
//   POST   /api/v1/exercises                 (Admin: create a new exercise with video)
// ============================================================================

const {
  Injectable,
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Bind,
  Dependencies,
  NotFoundException,
  BadRequestException,
  Module,
} = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaService } = require('../../database/prisma.service');
const { APP_CONFIG } = require('../../config/env.validation');
const {
  sanitizeString,
  sanitizeSlugOrId,
  parsePagination,
} = require('../../common/sanitize.util');
const { buildFourStepInstructions } = require('../../common/four-step-sequence.util');

const CUSTOM_VIDEOS_FILE = path.resolve(
  process.cwd(),
  'prisma',
  'data',
  'custom-videos.json'
);
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'videos');

function ensureStorageDirs() {
  try {
    const dataDir = path.dirname(CUSTOM_VIDEOS_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (_) {}
}

function loadCustomVideosMap() {
  ensureStorageDirs();
  try {
    if (fs.existsSync(CUSTOM_VIDEOS_FILE)) {
      const raw = fs.readFileSync(CUSTOM_VIDEOS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read custom-videos.json:', err.message);
  }
  return {};
}

function saveCustomVideosMap(mapObj) {
  ensureStorageDirs();
  try {
    fs.writeFileSync(CUSTOM_VIDEOS_FILE, JSON.stringify(mapObj, null, 2), 'utf8');
  } catch (err) {
    console.error('Could not write custom-videos.json:', err.message);
  }
}

/**
 * Validates and normalizes video URLs (direct MP4/WebM, local /uploads/..., or YouTube/Vimeo)
 */
function sanitizeVideoUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim().slice(0, 600);
  if (!trimmed) return '';
  if (
    trimmed.startsWith('/uploads/videos/') ||
    trimmed.startsWith('/uploads/exercise-videos/') ||
    trimmed.startsWith('/api/v1/media/') ||
    trimmed.startsWith('/api/media/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    // Strip any dangerous javascript: or data:html schemes
    return trimmed.replace(/[<>"']/g, '');
  }
  throw new BadRequestException(
    'Video URL must start with https://, http://, /api/v1/media/, /uploads/videos/, or /uploads/exercise-videos/'
  );
}

@Injectable()
@Dependencies(PrismaService)
class ExercisesService {
  constructor(prismaService) {
    this.prisma = prismaService;
    this.customVideos = loadCustomVideosMap();
  }

  _buildSignedMediaStreamUrl(mediaId) {
    const ttl = APP_CONFIG.MINIO_PRESIGNED_EXPIRY_SEC || 900;
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const sig = crypto
      .createHmac('sha256', APP_CONFIG.MEDIA_STREAM_SECRET)
      .update(`${mediaId}:${exp}`)
      .digest('hex');
    return `/api/v1/media/${mediaId}/stream?exp=${exp}&sig=${sig}`;
  }

  _enrichWithVideo(exercise) {
    if (!exercise) return null;
    const customMap = loadCustomVideosMap();
    const custom =
      customMap[exercise.slug] ||
      customMap[exercise.id] ||
      this.customVideos[exercise.slug] ||
      this.customVideos[exercise.id] ||
      null;

    const mediaRows =
      Array.isArray(exercise.mediaItems) && exercise.mediaItems.length > 0
        ? exercise.mediaItems
        : (this.prisma.memoryStore?.exerciseMedia || []).filter(
            (m) => m.exerciseId === exercise.id
          );

    const minioVideos = mediaRows.filter((m) => m.mediaType === 'VIDEO');
    const frontMinio = minioVideos.find((v) => (v.angle || 'front') !== 'side') || minioVideos[0] || null;
    const sideMinio = minioVideos.find((v) => v.angle === 'side') || null;

    const instructionImages = { 1: null, 2: null, 3: null, 4: null };
    const formattedMediaItems = mediaRows.map((row) => {
      const streamUrl = this._buildSignedMediaStreamUrl(row.id);
      const item = {
        id: row.id,
        mediaType: row.mediaType,
        stepNumber: row.stepNumber,
        angle: row.angle || 'front',
        objectKey: row.objectKey,
        originalFilename: row.originalFilename,
        mimeType: row.mimeType,
        fileSize: row.fileSize,
        width: row.width || null,
        height: row.height || null,
        targetMusclePart: row.targetMusclePart || null,
        notes: row.notes || null,
        streamUrl,
        updatedAt: row.updatedAt,
      };
      if (row.mediaType === 'IMAGE' && row.stepNumber >= 1 && row.stepNumber <= 4) {
        instructionImages[row.stepNumber] = item;
      }
      return item;
    });

    const videoUrl = frontMinio
      ? this._buildSignedMediaStreamUrl(frontMinio.id)
      : (custom && custom.videoUrl) || exercise.mediaUrl || '';
    const sideVideoUrl = sideMinio
      ? this._buildSignedMediaStreamUrl(sideMinio.id)
      : (custom && custom.sideVideoUrl) || '';
    const videoNotes = (frontMinio && frontMinio.notes) || (custom && custom.videoNotes) || '';
    const targetMusclePart =
      (frontMinio && frontMinio.targetMusclePart) || (custom && custom.targetMusclePart) || '';
    const targetEquipment = (custom && custom.targetEquipment) || '';
    const videoUpdatedAt = (frontMinio && frontMinio.updatedAt) || (custom && custom.updatedAt) || null;

    const normalizedSteps = buildFourStepInstructions(exercise, instructionImages);

    return {
      ...exercise,
      instructions: normalizedSteps,
      stepImages: normalizedSteps,
      mediaUrl: videoUrl || null,
      videoUrl: videoUrl || null,
      sideVideoUrl: sideVideoUrl || null,
      videoNotes: videoNotes || null,
      targetMusclePart: targetMusclePart || null,
      targetEquipment: targetEquipment || null,
      hasCustomVideo: Boolean(videoUrl || sideVideoUrl),
      videoUpdatedAt,
      mediaItems: formattedMediaItems,
      instructionImages,
    };
  }

  async findAll(query = {}) {
    const rawExercises = await this.prisma.getAllExercisesFormatted();
    const allExercises = rawExercises.map((ex) => this._enrichWithVideo(ex));
    const { page, limit, skip } = parsePagination(query, {
      page: 1,
      limit: 60,
      maxLimit: 100,
    });

    const category = query.category ? sanitizeString(query.category, 40).toLowerCase() : null;
    const muscle = query.muscle ? sanitizeSlugOrId(query.muscle) : null;
    const rawEquipment = query.equipment ? sanitizeString(query.equipment, 160).toLowerCase() : null;
    const subRegion = query.subRegion ? sanitizeString(query.subRegion, 40).toLowerCase() : null;
    const difficulty = query.difficulty
      ? sanitizeString(query.difficulty, 24).toUpperCase()
      : null;
    const exerciseType =
      query.type || query.exerciseType
        ? sanitizeString(query.type || query.exerciseType, 24).toUpperCase()
        : null;
    const popularOnly = query.popular === 'true';
    const hasVideoOnly = query.hasVideo === 'true';
    const searchQ = query.q ? sanitizeString(query.q, 80).toLowerCase() : null;
    const sortBy = query.sort ? sanitizeString(query.sort, 24) : 'name';

    let filtered = [...allExercises];

    if (category && category !== 'all') {
      filtered = filtered.filter(
        (ex) =>
          ex.category.toLowerCase() === category ||
          (ex.muscleGroup && ex.muscleGroup.slug.toLowerCase() === category)
      );
    }

    if (muscle && muscle !== 'all') {
      filtered = filtered.filter(
        (ex) =>
          ex.category.toLowerCase() === muscle ||
          (ex.muscleGroup && ex.muscleGroup.slug === muscle) ||
          (ex.primaryMuscles || []).some(
            (m) =>
              m.slug === muscle ||
              m.svgRegionId === muscle ||
              m.name.toLowerCase().includes(muscle)
          ) ||
          (ex.secondaryMuscles || []).some(
            (m) => m.slug === muscle || m.svgRegionId === muscle
          )
      );
    }

    if (rawEquipment && rawEquipment !== 'all') {
      const eqTerms = rawEquipment
        .split(',')
        .map((item) => sanitizeSlugOrId(item))
        .filter(Boolean);

      if (eqTerms.length === 1 && eqTerms[0] === 'none') {
        filtered = [];
      } else if (eqTerms.length > 0) {
        // Multi-equipment OR logic: match exercises that use ANY of the selected equipment categories
        filtered = filtered.filter((ex) =>
          (ex.equipment || []).some((eq) =>
            eqTerms.some(
              (term) =>
                eq.slug === term ||
                (term === 'cable' && eq.slug === 'cable-machine') ||
                (term === 'dumbbells' && eq.slug === 'dumbbell') ||
                eq.name.toLowerCase().includes(term.replace(/-/g, ' '))
            )
          )
        );
      }
    }

    if (subRegion && subRegion !== 'all') {
      filtered = filtered.filter((ex) => {
        const sr = (ex.subRegion || '').toLowerCase();
        const nameDesc = `${ex.name} ${ex.description}`.toLowerCase();
        if (sr && sr.includes(subRegion)) return true;
        if (subRegion.includes('upper')) return nameDesc.includes('incline') || nameDesc.includes('low-to-high') || nameDesc.includes('clavicular') || nameDesc.includes('decline push-up');
        if (subRegion.includes('lower')) return nameDesc.includes('decline') || nameDesc.includes('dip') || nameDesc.includes('high-to-low');
        if (subRegion.includes('middle')) return !nameDesc.includes('incline') && !nameDesc.includes('decline');
        return true;
      });
    }

    if (difficulty && difficulty !== 'ALL') {
      filtered = filtered.filter((ex) => ex.difficulty.toUpperCase() === difficulty);
    }

    if (exerciseType && exerciseType !== 'ALL') {
      filtered = filtered.filter((ex) => ex.exerciseType.toUpperCase() === exerciseType);
    }

    if (popularOnly) {
      filtered = filtered.filter((ex) => ex.isPopular);
    }

    if (hasVideoOnly) {
      filtered = filtered.filter((ex) => ex.hasCustomVideo);
    }

    if (searchQ) {
      filtered = filtered.filter((ex) => {
        const haystacks = [
          ex.name,
          ex.category,
          ex.description,
          ex.difficulty,
          ex.exerciseType,
          ...(ex.primaryMuscles || []).map((m) => `${m.name} ${m.scientificName}`),
          ...(ex.secondaryMuscles || []).map((m) => `${m.name} ${m.scientificName}`),
          ...(ex.equipment || []).map((eq) => eq.name),
        ]
          .join(' ')
          .toLowerCase();
        return haystacks.includes(searchQ);
      });
    }

    if (sortBy === 'difficulty') {
      const rank = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
      filtered.sort((a, b) => (rank[a.difficulty] || 9) - (rank[b.difficulty] || 9));
    } else if (sortBy === 'category') {
      filtered.sort(
        (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
      );
    } else if (sortBy === 'popular') {
      filtered.sort(
        (a, b) => Number(b.isPopular) - Number(a.isPopular) || a.name.localeCompare(b.name)
      );
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        videosConfiguredCount: allExercises.filter((e) => e.hasCustomVideo).length,
      },
    };
  }

  async findByIdOrSlug(idOrSlug) {
    const cleanId = sanitizeSlugOrId(idOrSlug);
    const rawExercises = await this.prisma.getAllExercisesFormatted();
    const allExercises = rawExercises.map((ex) => this._enrichWithVideo(ex));

    const exercise = allExercises.find(
      (ex) => ex.id.toLowerCase() === cleanId || ex.slug.toLowerCase() === cleanId
    );

    if (!exercise) {
      throw new NotFoundException(`Exercise '${cleanId}' not found.`);
    }

    const primarySlugs = new Set((exercise.primaryMuscles || []).map((m) => m.slug));
    const similarExercises = allExercises
      .filter((candidate) => candidate.id !== exercise.id)
      .map((candidate) => {
        let score = 0;
        if (candidate.category === exercise.category) score += 4;
        if (candidate.exerciseType === exercise.exerciseType) score += 2;
        for (const pm of candidate.primaryMuscles || []) {
          if (primarySlugs.has(pm.slug)) score += 5;
        }
        return { candidate, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((item) => item.candidate);

    return {
      ...exercise,
      similarExercises,
    };
  }

  async compareExercises(firstIdOrSlug, secondIdOrSlug) {
    const firstClean = sanitizeSlugOrId(firstIdOrSlug || 'barbell-bench-press');
    const secondClean = sanitizeSlugOrId(secondIdOrSlug || 'dumbbell-bench-press');

    if (!firstClean || !secondClean) {
      throw new BadRequestException(
        'Please provide both first and second exercise slugs to compare.'
      );
    }

    const first = await this.findByIdOrSlug(firstClean);
    const second = await this.findByIdOrSlug(secondClean);

    const firstPrimarySlugs = new Set((first.primaryMuscles || []).map((m) => m.slug));
    const secondPrimarySlugs = new Set((second.primaryMuscles || []).map((m) => m.slug));
    const sharedPrimaryMuscles = (first.primaryMuscles || []).filter((m) =>
      secondPrimarySlugs.has(m.slug)
    );

    return {
      first,
      second,
      comparisonSummary: {
        sameCategory: first.category === second.category,
        sharedPrimaryMuscles,
        difficultyComparison:
          first.difficulty === second.difficulty
            ? `Both exercises are rated ${first.difficulty}.`
            : `${first.name} is rated ${first.difficulty}, whereas ${second.name} is rated ${second.difficulty}.`,
        mechanicsComparison: `${first.name} is a ${first.exerciseType} (${first.forceType}) movement, while ${second.name} is a ${second.exerciseType} (${second.forceType}) movement.`,
        firstUniquePrimary: (first.primaryMuscles || []).filter(
          (m) => !secondPrimarySlugs.has(m.slug)
        ),
        secondUniquePrimary: (second.primaryMuscles || []).filter(
          (m) => !firstPrimarySlugs.has(m.slug)
        ),
      },
    };
  }

  /**
   * Admin: Assign or update Front Angle & Side Angle demonstration videos for an exercise
   */
  async updateExerciseVideo(idOrSlug, body = {}) {
    const exercise = await this.findByIdOrSlug(idOrSlug);
    const videoUrl = sanitizeVideoUrl(body.videoUrl || '');
    const sideVideoUrl = sanitizeVideoUrl(body.sideVideoUrl || '');
    const videoNotes = sanitizeString(body.videoNotes || '', 300);
    const targetMusclePart = sanitizeString(body.targetMusclePart || '', 120);
    const targetEquipment = sanitizeString(body.targetEquipment || '', 80);

    if (!videoUrl && !sideVideoUrl) {
      throw new BadRequestException(
        'Please provide at least a Primary/Front Video URL or upload a video file.'
      );
    }

    const record = {
      exerciseSlug: exercise.slug,
      videoUrl,
      sideVideoUrl,
      videoNotes,
      targetMusclePart,
      targetEquipment,
      updatedAt: new Date().toISOString(),
    };

    this.customVideos[exercise.slug] = record;
    saveCustomVideosMap(this.customVideos);

    // Update memoryStore and PostgreSQL if connected
    const memTarget = this.prisma.memoryStore.exercises.find(
      (e) => e.slug === exercise.slug
    );
    if (memTarget) {
      memTarget.mediaUrl = videoUrl;
    }

    if (this.prisma.isPostgresConnected && this.prisma.client) {
      try {
        await this.prisma.client.exercise.update({
          where: { slug: exercise.slug },
          data: { mediaUrl: videoUrl || null },
        });
      } catch (_) {}
    }

    return this.findByIdOrSlug(exercise.slug);
  }

  /**
   * Admin: Upload a video file (.mp4, .webm, .mov, .gif) encoded as base64 data URL
   */
  async uploadExerciseVideoFile(idOrSlug, body = {}) {
    const exercise = await this.findByIdOrSlug(idOrSlug);
    const {
      fileName,
      fileDataUrl,
      angle = 'front',
      videoNotes = '',
      targetMusclePart = '',
      targetEquipment = '',
      organizedByCategory = false,
    } = body || {};

    if (!fileDataUrl || typeof fileDataUrl !== 'string') {
      throw new BadRequestException('No video file payload received.');
    }

    const match = fileDataUrl.match(
      /^data:(video\/(?:mp4|webm|quicktime|ogg)|image\/gif);base64,(.+)$/i
    );
    if (!match) {
      throw new BadRequestException(
        'Unsupported video format. Please upload an MP4, WebM, MOV, or GIF file.'
      );
    }

    const mimeType = match[1].toLowerCase();
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Enforce 40 MB max file size
    if (buffer.length > 40 * 1024 * 1024) {
      throw new BadRequestException('Video file exceeds 40MB maximum limit.');
    }

    const extMap = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'video/ogg': '.ogv',
      'image/gif': '.gif',
    };
    const ext = extMap[mimeType] || path.extname(fileName || '.mp4') || '.mp4';
    const cleanAngle = angle === 'side' ? 'side' : 'front';

    ensureStorageDirs();
    let publicUrl;
    if (organizedByCategory) {
      const catFolder = sanitizeSlugOrId(exercise.category || 'general') || 'general';
      const targetDir = path.resolve(process.cwd(), 'uploads', 'exercise-videos', catFolder);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      const fileSlugName = `${exercise.slug}${ext}`;
      const fullPath = path.join(targetDir, fileSlugName);
      fs.writeFileSync(fullPath, buffer);
      publicUrl = `/uploads/exercise-videos/${catFolder}/${fileSlugName}`;
    } else {
      const safeFileName = `${exercise.slug}-${cleanAngle}-${Date.now()}${ext}`;
      const fullPath = path.join(UPLOADS_DIR, safeFileName);
      fs.writeFileSync(fullPath, buffer);
      publicUrl = `/uploads/videos/${safeFileName}`;
    }
    const existing = this.customVideos[exercise.slug] || {};

    const updatedPayload = {
      videoUrl: cleanAngle === 'front' ? publicUrl : existing.videoUrl || publicUrl,
      sideVideoUrl: cleanAngle === 'side' ? publicUrl : existing.sideVideoUrl || '',
      videoNotes: videoNotes || existing.videoNotes || '',
      targetMusclePart: targetMusclePart || existing.targetMusclePart || '',
      targetEquipment: targetEquipment || existing.targetEquipment || '',
    };

    return this.updateExerciseVideo(exercise.slug, updatedPayload);
  }

  /**
   * Admin: Remove custom video assignment from an exercise
   */
  async removeExerciseVideo(idOrSlug) {
    const exercise = await this.findByIdOrSlug(idOrSlug);
    delete this.customVideos[exercise.slug];
    saveCustomVideosMap(this.customVideos);

    const memTarget = this.prisma.memoryStore.exercises.find(
      (e) => e.slug === exercise.slug
    );
    if (memTarget) {
      memTarget.mediaUrl = null;
    }

    if (this.prisma.isPostgresConnected && this.prisma.client) {
      try {
        await this.prisma.client.exercise.update({
          where: { slug: exercise.slug },
          data: { mediaUrl: null },
        });
      } catch (_) {}
    }

    return this.findByIdOrSlug(exercise.slug);
  }
}

@ApiTags('Exercises & Admin Video Manager')
@Controller('exercises')
@Dependencies(ExercisesService)
class ExercisesController {
  constructor(exercisesService) {
    this.exercisesService = exercisesService;
  }

  @Get()
  @Bind(Query())
  @ApiOperation({ summary: 'List and filter gym exercises with pagination & video metadata' })
  async findAll(query) {
    return this.exercisesService.findAll(query);
  }

  @Get('compare')
  @Bind(Query())
  @ApiOperation({
    summary: 'Compare two exercises side by side (target muscles, equipment, pros/cons)',
  })
  async compare(query) {
    return this.exercisesService.compareExercises(query.first, query.second);
  }

  @Get(':id')
  @Bind(Param('id'))
  @ApiOperation({
    summary: 'Get full exercise details, video URLs, instructions, mistakes & similar exercises',
  })
  async findOne(id) {
    return this.exercisesService.findByIdOrSlug(id);
  }

  @Put(':id/video')
  @Bind(Param('id'), Body())
  @ApiOperation({
    summary: 'Admin: Assign or update Front Angle and Side Angle demonstration video URLs for an exercise',
  })
  async updateVideo(id, body) {
    return this.exercisesService.updateExerciseVideo(id, body);
  }

  @Post(':id/video-file')
  @Bind(Param('id'), Body())
  @ApiOperation({
    summary: 'Admin: Upload an MP4/WebM/GIF demonstration video file for a specific exercise',
  })
  async uploadVideoFile(id, body) {
    return this.exercisesService.uploadExerciseVideoFile(id, body);
  }

  @Delete(':id/video')
  @Bind(Param('id'))
  @ApiOperation({
    summary: 'Admin: Remove custom demonstration video from an exercise',
  })
  async deleteVideo(id) {
    return this.exercisesService.removeExerciseVideo(id);
  }
}

@Module({
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
class ExercisesModule {}

module.exports = {
  ExercisesService,
  ExercisesController,
  ExercisesModule,
};
