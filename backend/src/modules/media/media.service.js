// ============================================================================
// GYMGUIDE - MEDIA METADATA, SIGNED DELIVERY & RESUMABLE MIGRATION SERVICE
// Manages MinIO object storage + PostgreSQL exercise_media metadata + fallback
// ============================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  Injectable,
  Dependencies,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} = require('@nestjs/common');
const { PrismaService } = require('../../database/prisma.service');
const { MinioStorageService } = require('./minio-storage.service');
const {
  validateAndOptimizeImage,
  validateVideoUpload,
} = require('./media-processing.util');
const { APP_CONFIG } = require('../../config/env.validation');
const { sanitizeString, sanitizeSlugOrId } = require('../../common/sanitize.util');

const CUSTOM_VIDEOS_FILE = path.resolve(
  process.cwd(),
  'prisma',
  'data',
  'custom-videos.json'
);
const MIGRATION_REPORT_FILE = path.resolve(
  process.cwd(),
  'prisma',
  'data',
  'minio-migration-report.json'
);

function readCustomVideosSafe() {
  try {
    if (fs.existsSync(CUSTOM_VIDEOS_FILE)) {
      return JSON.parse(fs.readFileSync(CUSTOM_VIDEOS_FILE, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function writeCustomVideosSafe(mapObj) {
  try {
    const dir = path.dirname(CUSTOM_VIDEOS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CUSTOM_VIDEOS_FILE, JSON.stringify(mapObj, null, 2), 'utf8');
  } catch (_) {}
}

@Injectable()
@Dependencies(PrismaService, MinioStorageService)
class MediaService {
  constructor(prismaService, minioStorage) {
    this.prisma = prismaService;
    this.minio = minioStorage;
  }

  _signStreamToken(mediaId, expiresAtEpochSec) {
    const payload = `${mediaId}:${expiresAtEpochSec}`;
    return crypto
      .createHmac('sha256', APP_CONFIG.MEDIA_STREAM_SECRET)
      .update(payload)
      .digest('hex');
  }

  verifyStreamToken(mediaId, expStr, sigStr) {
    const exp = parseInt(expStr, 10);
    if (!exp || Number.isNaN(exp) || !sigStr || typeof sigStr !== 'string') {
      throw new ForbiddenException('Missing signed media token parameters.');
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (nowSec > exp) {
      throw new ForbiddenException('Signed media URL has expired. Request a refreshed URL.');
    }

    const expectedSig = this._signStreamToken(mediaId, exp);
    const sigBuf = Buffer.from(sigStr, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new ForbiddenException('Invalid signed media URL signature.');
    }
    return true;
  }

  async _resolveExercise(idOrSlug) {
    const clean = sanitizeSlugOrId(String(idOrSlug || ''), 120);
    if (!clean) {
      throw new BadRequestException('A valid exerciseId or exerciseSlug is required.');
    }

    if (this.prisma.isPostgresConnected && this.prisma.client) {
      const found = await this.prisma.client.exercise.findFirst({
        where: { OR: [{ id: clean }, { slug: clean }] },
        include: {
          exerciseEquipment: { include: { equipment: true } },
        },
      });
      if (!found) {
        throw new NotFoundException(`Exercise "${clean}" was not found.`);
      }
      return {
        ...found,
        equipment: (found.exerciseEquipment || []).map((ee) => ee.equipment).filter(Boolean),
      };
    }

    const found = this.prisma.memoryStore.exercises.find(
      (e) => e.id === clean || e.slug === clean
    );
    if (!found) {
      throw new NotFoundException(`Exercise "${clean}" was not found.`);
    }
    return found;
  }

  async _findMediaRowById(id) {
    const cleanId = sanitizeString(String(id || ''), 80);
    if (!cleanId) {
      throw new BadRequestException('Valid media ID is required.');
    }
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.exerciseMedia.findUnique({ where: { id: cleanId } });
    }
    return this.prisma.memoryStore.exerciseMedia.find((m) => m.id === cleanId) || null;
  }

  async _listAllMediaRows() {
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.exerciseMedia.findMany({
        orderBy: [{ mediaType: 'asc' }, { stepNumber: 'asc' }, { createdAt: 'asc' }],
      });
    }
    return [...this.prisma.memoryStore.exerciseMedia].sort((a, b) => {
      if (a.mediaType !== b.mediaType) return a.mediaType.localeCompare(b.mediaType);
      return (a.stepNumber || 0) - (b.stepNumber || 0);
    });
  }

  async _listExerciseMediaRows(exerciseId) {
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.exerciseMedia.findMany({
        where: { exerciseId },
        orderBy: [{ mediaType: 'asc' }, { stepNumber: 'asc' }, { createdAt: 'asc' }],
      });
    }
    return this.prisma.memoryStore.exerciseMedia
      .filter((m) => m.exerciseId === exerciseId)
      .sort((a, b) => {
        if (a.mediaType !== b.mediaType) return a.mediaType.localeCompare(b.mediaType);
        return (a.stepNumber || 0) - (b.stepNumber || 0);
      });
  }

  async _saveOrReplaceMediaRow(data) {
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      let existing = null;
      if (data.mediaType === 'IMAGE') {
        existing = await this.prisma.client.exerciseMedia.findFirst({
          where: {
            exerciseId: data.exerciseId,
            mediaType: 'IMAGE',
            stepNumber: data.stepNumber,
          },
        });
      } else {
        existing = await this.prisma.client.exerciseMedia.findFirst({
          where: {
            exerciseId: data.exerciseId,
            mediaType: 'VIDEO',
            angle: data.angle || 'front',
          },
        });
      }

      if (existing) {
        const updated = await this.prisma.client.exerciseMedia.update({
          where: { id: existing.id },
          data: {
            bucket: data.bucket,
            objectKey: data.objectKey,
            originalFilename: data.originalFilename,
            mimeType: data.mimeType,
            fileSize: data.fileSize,
            width: data.width,
            height: data.height,
            targetMusclePart: data.targetMusclePart,
            sourceUrl: data.sourceUrl,
            notes: data.notes,
          },
        });
        return { record: updated, previousObjectKey: existing.objectKey };
      }

      const created = await this.prisma.client.exerciseMedia.create({
        data,
      });
      return { record: created, previousObjectKey: null };
    }

    const store = this.prisma.memoryStore.exerciseMedia;
    const matchIdx = store.findIndex((m) =>
      data.mediaType === 'IMAGE'
        ? m.exerciseId === data.exerciseId &&
          m.mediaType === 'IMAGE' &&
          m.stepNumber === data.stepNumber
        : m.exerciseId === data.exerciseId &&
          m.mediaType === 'VIDEO' &&
          (m.angle || 'front') === (data.angle || 'front')
    );

    const nowIso = new Date().toISOString();
    if (matchIdx >= 0) {
      const prev = store[matchIdx];
      const updated = {
        ...prev,
        ...data,
        id: prev.id,
        createdAt: prev.createdAt,
        updatedAt: nowIso,
      };
      store[matchIdx] = updated;
      this.prisma.saveFallbackMediaMetadata();
      return { record: updated, previousObjectKey: prev.objectKey };
    }

    const created = {
      id: `med-${crypto.randomUUID()}`,
      ...data,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    store.push(created);
    this.prisma.saveFallbackMediaMetadata();
    return { record: created, previousObjectKey: null };
  }

  async _deleteMediaRowById(id) {
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.exerciseMedia.delete({ where: { id } });
    }
    const store = this.prisma.memoryStore.exerciseMedia;
    const idx = store.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const [removed] = store.splice(idx, 1);
    this.prisma.saveFallbackMediaMetadata();
    return removed;
  }

  async buildMediaPayload(record, includePresignedUrl = true) {
    if (!record) return null;
    const expiresIn = APP_CONFIG.MINIO_PRESIGNED_EXPIRY_SEC || 900;
    const expiresAtSec = Math.floor(Date.now() / 1000) + expiresIn;
    const sig = this._signStreamToken(record.id, expiresAtSec);
    const streamUrl = `/api/v1/media/${record.id}/stream?exp=${expiresAtSec}&sig=${sig}`;

    let signedUrl = null;
    if (includePresignedUrl && this.minio.isConfigured) {
      try {
        signedUrl = await this.minio.getSignedDownloadUrl(record.objectKey, expiresIn);
      } catch (_) {
        signedUrl = null;
      }
    }

    return {
      id: record.id,
      exerciseId: record.exerciseId,
      mediaType: record.mediaType,
      stepNumber: record.stepNumber,
      angle: record.angle || 'front',
      bucket: record.bucket,
      objectKey: record.objectKey,
      originalFilename: record.originalFilename,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      width: record.width || null,
      height: record.height || null,
      targetMusclePart: record.targetMusclePart || null,
      sourceUrl: record.sourceUrl || null,
      notes: record.notes || null,
      streamUrl,
      signedUrl: signedUrl || streamUrl,
      expiresIn,
      expiresAt: new Date(expiresAtSec * 1000).toISOString(),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Syncs primary video media with Exercise.mediaUrl + legacy custom-videos.json safely
   */
  async _syncExerciseVideoSummary(exercise) {
    const mediaRows = await this._listExerciseMediaRows(exercise.id);
    const videos = mediaRows.filter((m) => m.mediaType === 'VIDEO');
    const frontVideo = videos.find((v) => (v.angle || 'front') === 'front') || videos[0];
    const sideVideo = videos.find((v) => v.angle === 'side');

    const frontStreamPath = frontVideo ? `/api/v1/media/${frontVideo.id}/stream` : null;
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      try {
        await this.prisma.client.exercise.update({
          where: { id: exercise.id },
          data: { mediaUrl: frontStreamPath },
        });
      } catch (_) {}
    } else {
      const mem = this.prisma.memoryStore.exercises.find((e) => e.id === exercise.id);
      if (mem) mem.mediaUrl = frontStreamPath;
    }

    // Keep non-MinIO external fallback intact only if no MinIO video exists
    const customMap = readCustomVideosSafe();
    if (frontVideo || sideVideo) {
      customMap[exercise.slug] = {
        ...(customMap[exercise.slug] || {}),
        exerciseSlug: exercise.slug,
        videoUrl: frontVideo ? `/api/v1/media/${frontVideo.id}/stream` : '',
        sideVideoUrl: sideVideo ? `/api/v1/media/${sideVideo.id}/stream` : '',
        videoNotes: frontVideo?.notes || customMap[exercise.slug]?.videoNotes || '',
        targetMusclePart:
          frontVideo?.targetMusclePart || customMap[exercise.slug]?.targetMusclePart || '',
        storageBackend: 'minio',
        objectKey: frontVideo?.objectKey || sideVideo?.objectKey || null,
        updatedAt: new Date().toISOString(),
      };
      writeCustomVideosSafe(customMap);
    } else if (customMap[exercise.slug]?.storageBackend === 'minio') {
      delete customMap[exercise.slug];
      writeCustomVideosSafe(customMap);
    }
  }

  /**
   * Uploads one validated image (WebP) or video (MP4/WebM/MOV) into MinIO & stores metadata in PostgreSQL
   */
  async uploadSingleMedia({
    file,
    exerciseIdOrSlug,
    mediaType,
    stepNumber = null,
    angle = 'front',
    targetMusclePart = '',
    notes = '',
    sourceUrl = '',
  }) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Attach multipart field "file".');
    }

    const exercise = await this._resolveExercise(exerciseIdOrSlug);
    const normalizedType = String(mediaType || '').toUpperCase();
    if (normalizedType !== 'VIDEO' && normalizedType !== 'IMAGE') {
      throw new BadRequestException('mediaType must be either VIDEO or IMAGE.');
    }

    let parsedStep = null;
    if (normalizedType === 'IMAGE') {
      parsedStep = parseInt(stepNumber, 10);
      if (Number.isNaN(parsedStep) || parsedStep < 1 || parsedStep > 4) {
        throw new BadRequestException(
          'Instructional images require stepNumber between 1 and 4.'
        );
      }
    }

    const cleanAngle =
      normalizedType === 'VIDEO' ? sanitizeSlugOrId(angle || 'front', 16) || 'front' : null;
    const processed =
      normalizedType === 'IMAGE'
        ? await validateAndOptimizeImage(file)
        : validateVideoUpload(file);

    const objectKey = this.minio.buildExerciseObjectKey(exercise.category, exercise.slug, {
      mediaType: normalizedType,
      stepNumber: parsedStep,
      angle: cleanAngle,
      ext: processed.ext,
    });

    try {
      await this.minio.uploadObject({
        objectKey,
        buffer: processed.buffer,
        contentType: processed.mimeType,
        metadata: {
          'exercise-slug': exercise.slug,
          'media-type': normalizedType,
          ...(parsedStep ? { 'step-number': String(parsedStep) } : {}),
        },
      });
    } catch (err) {
      throw new ServiceUnavailableException(
        `MinIO upload failed: ${this.minio._safeErrorMessage(err)}`
      );
    }

    const cleanPart = sanitizeString(targetMusclePart || '', 120) || null;
    const cleanNotes = sanitizeString(notes || '', 300) || null;
    const cleanSource = sourceUrl ? sanitizeString(sourceUrl, 600) : null;

    const { record, previousObjectKey } = await this._saveOrReplaceMediaRow({
      exerciseId: exercise.id,
      mediaType: normalizedType,
      stepNumber: parsedStep,
      angle: cleanAngle,
      bucket: this.minio.bucket,
      objectKey,
      originalFilename: processed.originalFilename,
      mimeType: processed.mimeType,
      fileSize: processed.fileSize,
      width: processed.width,
      height: processed.height,
      targetMusclePart: cleanPart,
      sourceUrl: cleanSource,
      notes: cleanNotes,
    });

    if (previousObjectKey && previousObjectKey !== objectKey) {
      try {
        await this.minio.deleteObject(previousObjectKey);
      } catch (_) {}
    }

    if (normalizedType === 'VIDEO') {
      await this._syncExerciseVideoSummary(exercise);
    }

    return this.buildMediaPayload(record, true);
  }

  /**
   * Batch upload multiple instructional images / video cleanly with explicit per-file reporting
   */
  async uploadMultipleMedia(files = [], body = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files received in multipart field "files".');
    }

    const exerciseIdOrSlug = body.exerciseId || body.exerciseSlug || body.slug;
    if (!exerciseIdOrSlug) {
      throw new BadRequestException('exerciseId or exerciseSlug is required.');
    }

    let stepMetaList = [];
    if (body.items) {
      try {
        stepMetaList = typeof body.items === 'string' ? JSON.parse(body.items) : body.items;
      } catch (_) {
        throw new BadRequestException('Invalid JSON format in "items" metadata.');
      }
    } else if (body.steps) {
      try {
        stepMetaList = typeof body.steps === 'string' ? JSON.parse(body.steps) : body.steps;
      } catch (_) {}
    }

    const uploaded = [];
    const failed = [];

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      const meta = stepMetaList[i] || {};
      const inferredIsVideo =
        meta.mediaType === 'VIDEO' ||
        String(file.mimetype || '').startsWith('video/');
      const mediaType = inferredIsVideo ? 'VIDEO' : 'IMAGE';

      let stepNumber = meta.stepNumber;
      if (mediaType === 'IMAGE' && !stepNumber) {
        const match = String(file.originalname || '').match(/step[-_ ]?0?([1-4])/i);
        stepNumber = match ? parseInt(match[1], 10) : Math.min(4, i + 1);
      }

      try {
        const saved = await this.uploadSingleMedia({
          file,
          exerciseIdOrSlug,
          mediaType,
          stepNumber,
          angle: meta.angle || body.angle || 'front',
          targetMusclePart: meta.targetMusclePart || body.targetMusclePart || '',
          notes: meta.notes || body.notes || '',
        });
        uploaded.push(saved);
      } catch (err) {
        failed.push({
          filename: file.originalname,
          mediaType,
          stepNumber: stepNumber || null,
          error: err.message || 'Upload failed.',
        });
      }
    }

    return {
      exerciseIdOrSlug,
      uploadedCount: uploaded.length,
      failedCount: failed.length,
      uploaded,
      failed,
    };
  }

  async getMediaByExercise(exerciseIdOrSlug) {
    const exercise = await this._resolveExercise(exerciseIdOrSlug);
    const rows = await this._listExerciseMediaRows(exercise.id);
    const payloads = await Promise.all(rows.map((r) => this.buildMediaPayload(r, true)));

    const videos = payloads.filter((m) => m.mediaType === 'VIDEO');
    const images = payloads.filter((m) => m.mediaType === 'IMAGE');
    const steps = { 1: null, 2: null, 3: null, 4: null };
    for (const img of images) {
      if (img.stepNumber >= 1 && img.stepNumber <= 4) {
        steps[img.stepNumber] = img;
      }
    }

    return {
      exerciseId: exercise.id,
      slug: exercise.slug,
      name: exercise.name,
      category: exercise.category,
      video: videos.find((v) => v.angle === 'front') || videos[0] || null,
      sideVideo: videos.find((v) => v.angle === 'side') || null,
      videos,
      steps,
      items: payloads,
    };
  }

  async getMediaById(id) {
    const row = await this._findMediaRowById(id);
    if (!row) {
      throw new NotFoundException(`Media record "${id}" was not found.`);
    }
    return this.buildMediaPayload(row, true);
  }

  async getSignedMediaUrl(id, expiresIn) {
    const row = await this._findMediaRowById(id);
    if (!row) {
      throw new NotFoundException(`Media record "${id}" was not found.`);
    }
    const existsInMinio = await this.minio.objectExists(row.objectKey).catch(() => false);
    if (!existsInMinio) {
      throw new NotFoundException(
        `Media object "${row.objectKey}" is missing from MinIO storage.`
      );
    }

    const ttl = Math.min(3600, Math.max(60, parseInt(expiresIn, 10) || APP_CONFIG.MINIO_PRESIGNED_EXPIRY_SEC || 900));
    const expiresAtSec = Math.floor(Date.now() / 1000) + ttl;
    const sig = this._signStreamToken(row.id, expiresAtSec);
    const signedUrl = await this.minio.getSignedDownloadUrl(row.objectKey, ttl);

    return {
      id: row.id,
      objectKey: row.objectKey,
      mediaType: row.mediaType,
      mimeType: row.mimeType,
      fileSize: row.fileSize,
      signedUrl,
      streamUrl: `/api/v1/media/${row.id}/stream?exp=${expiresAtSec}&sig=${sig}`,
      expiresIn: ttl,
      expiresAt: new Date(expiresAtSec * 1000).toISOString(),
    };
  }

  async streamMedia(id, query, rangeHeader, res) {
    const row = await this._findMediaRowById(id);
    if (!row) {
      throw new NotFoundException(`Media record "${id}" was not found.`);
    }

    this.verifyStreamToken(row.id, query.exp, query.sig);

    let obj;
    try {
      obj = await this.minio.getObjectStream(row.objectKey, rangeHeader);
    } catch (err) {
      throw new ServiceUnavailableException(
        `Unable to read media object from MinIO: ${this.minio._safeErrorMessage(err)}`
      );
    }

    const headers = {
      'Content-Type': row.mimeType || obj.contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    };
    if (obj.contentLength !== undefined) {
      headers['Content-Length'] = obj.contentLength;
    }
    if (obj.contentRange) {
      headers['Content-Range'] = obj.contentRange;
    }

    res.status(obj.statusCode || 200).set(headers);
    res.once('close', () => {
      if (obj.stream && typeof obj.stream.destroy === 'function') {
        obj.stream.destroy();
      }
    });
    obj.stream.on('error', () => {
      if (!res.headersSent) {
        res.status(502).end();
      } else {
        res.end();
      }
    });
    obj.stream.pipe(res);
  }

  async deleteMedia(id) {
    const row = await this._findMediaRowById(id);
    if (!row) {
      throw new NotFoundException(`Media record "${id}" was not found.`);
    }

    try {
      await this.minio.deleteObject(row.objectKey);
    } catch (err) {
      throw new ServiceUnavailableException(
        `Failed to delete object from MinIO: ${this.minio._safeErrorMessage(err)}`
      );
    }

    await this._deleteMediaRowById(row.id);

    if (row.mediaType === 'VIDEO') {
      const exercise = await this._resolveExercise(row.exerciseId).catch(() => null);
      if (exercise) {
        await this._syncExerciseVideoSummary(exercise);
      }
    }

    return {
      deleted: true,
      id: row.id,
      objectKey: row.objectKey,
      mediaType: row.mediaType,
      stepNumber: row.stepNumber,
    };
  }

  async getAdminMediaOverview() {
    const exercises = await this.prisma.getAllExercisesFormatted();
    const allMedia = await this._listAllMediaRows();
    const customVideos = readCustomVideosSafe();
    const storageHealth = await this.minio.getHealthStatus();

    const byExerciseId = new Map();
    for (const row of allMedia) {
      if (!byExerciseId.has(row.exerciseId)) {
        byExerciseId.set(row.exerciseId, []);
      }
      byExerciseId.get(row.exerciseId).push(row);
    }

    const items = await Promise.all(
      exercises.map(async (ex) => {
        const rows = byExerciseId.get(ex.id) || [];
        const payloads = await Promise.all(rows.map((r) => this.buildMediaPayload(r, true)));
        const video = payloads.find((m) => m.mediaType === 'VIDEO' && m.angle !== 'side') || payloads.find((m) => m.mediaType === 'VIDEO') || null;
        const sideVideo = payloads.find((m) => m.mediaType === 'VIDEO' && m.angle === 'side') || null;
        const steps = { 1: null, 2: null, 3: null, 4: null };
        for (const p of payloads) {
          if (p.mediaType === 'IMAGE' && p.stepNumber >= 1 && p.stepNumber <= 4) {
            steps[p.stepNumber] = p;
          }
        }
        const legacy = customVideos[ex.slug] || null;
        const legacyVideoUrl = legacy?.videoUrl || ex.mediaUrl || null;
        return {
          exerciseId: ex.id,
          slug: ex.slug,
          name: ex.name,
          category: ex.category,
          equipment: (ex.equipment || []).map((eq) => ({ id: eq.id, slug: eq.slug, name: eq.name })),
          hasMinioVideo: Boolean(video),
          hasLegacyVideo: Boolean(legacyVideoUrl && !String(legacyVideoUrl).includes('/api/v1/media/')),
          hasVideo: Boolean(video || legacyVideoUrl),
          video,
          sideVideo,
          legacyVideoUrl,
          steps,
          stepCount: [1, 2, 3, 4].filter((n) => Boolean(steps[n])).length,
        };
      })
    );

    return {
      storage: storageHealth,
      totalExercises: items.length,
      exercisesWithVideo: items.filter((i) => i.hasVideo).length,
      exercisesWithMinioVideo: items.filter((i) => i.hasMinioVideo).length,
      exercisesWithAllFourSteps: items.filter((i) => i.stepCount === 4).length,
      items,
    };
  }

  /**
   * Resumable, idempotent migration of existing videos/images into MinIO & PostgreSQL
   */
  async migrateLegacyMedia(options = {}) {
    const overwriteExisting = Boolean(options.overwriteExisting);
    const health = await this.minio.getHealthStatus();
    if (!health.connected) {
      throw new ServiceUnavailableException(
        `Cannot migrate media: MinIO storage is offline (${health.error || 'unreachable'}).`
      );
    }

    const exercises = await this.prisma.getAllExercisesFormatted();
    const allMedia = await this._listAllMediaRows();
    const customVideos = readCustomVideosSafe();

    const migratedHashes = new Map();
    const report = {
      generatedAt: new Date().toISOString(),
      bucket: this.minio.bucket,
      totalExercises: exercises.length,
      existingVideos: 0,
      existingImages: 0,
      migratedFiles: [],
      skippedAlreadyMigrated: [],
      failedMigrations: [],
      missingMedia: [],
      duplicateFiles: [],
      externalPreservedReferences: [],
    };

    for (const ex of exercises) {
      const exMedia = allMedia.filter((m) => m.exerciseId === ex.id);
      const existingMinioVideo = exMedia.find((m) => m.mediaType === 'VIDEO');
      const existingImages = exMedia.filter((m) => m.mediaType === 'IMAGE');
      report.existingImages += existingImages.length;

      const legacy = customVideos[ex.slug] || {};
      const candidateVideoUrl = legacy.videoUrl || ex.mediaUrl || '';

      if (!candidateVideoUrl) {
        if (existingMinioVideo) {
          report.existingVideos += 1;
        }
        continue;
      }

      report.existingVideos += 1;

      if (String(candidateVideoUrl).includes('/api/v1/media/') || (existingMinioVideo && !overwriteExisting)) {
        const exists = existingMinioVideo
          ? await this.minio.objectExists(existingMinioVideo.objectKey).catch(() => false)
          : false;
        if (exists) {
          report.skippedAlreadyMigrated.push({
            exerciseSlug: ex.slug,
            objectKey: existingMinioVideo.objectKey,
          });
          continue;
        }
      }

      // Local uploaded file check (/uploads/videos/... or /uploads/exercise-videos/...)
      if (candidateVideoUrl.startsWith('/uploads/')) {
        const relPath = candidateVideoUrl.replace(/^\/+/, '');
        const absFilePath = path.resolve(process.cwd(), relPath);
        if (!fs.existsSync(absFilePath)) {
          report.missingMedia.push({
            exerciseSlug: ex.slug,
            reference: candidateVideoUrl,
            reason: 'Local file referenced in custom-videos.json was not found on disk.',
          });
          continue;
        }

        try {
          const buffer = fs.readFileSync(absFilePath);
          const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
          if (migratedHashes.has(sha256)) {
            report.duplicateFiles.push({
              exerciseSlug: ex.slug,
              file: candidateVideoUrl,
              duplicateOfExercise: migratedHashes.get(sha256),
              sha256,
            });
          } else {
            migratedHashes.set(sha256, ex.slug);
          }

          const ext = path.extname(absFilePath).toLowerCase() || '.mp4';
          const mime =
            ext === '.webm'
              ? 'video/webm'
              : ext === '.mov'
              ? 'video/quicktime'
              : 'video/mp4';

          const uploaded = await this.uploadSingleMedia({
            file: {
              originalname: path.basename(absFilePath),
              mimetype: mime,
              buffer,
            },
            exerciseIdOrSlug: ex.slug,
            mediaType: 'VIDEO',
            angle: 'front',
            targetMusclePart: legacy.targetMusclePart || '',
            notes: legacy.videoNotes || '',
            sourceUrl: candidateVideoUrl,
          });

          report.migratedFiles.push({
            exerciseSlug: ex.slug,
            from: candidateVideoUrl,
            toObjectKey: uploaded.objectKey,
            fileSize: uploaded.fileSize,
          });
        } catch (err) {
          report.failedMigrations.push({
            exerciseSlug: ex.slug,
            reference: candidateVideoUrl,
            error: err.message,
          });
        }
      } else if (candidateVideoUrl.startsWith('http://') || candidateVideoUrl.startsWith('https://')) {
        // Attempt download of remote URL if reachable; preserve original reference safely if blocked
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 8000);
          const response = await fetch(candidateVideoUrl, { signal: controller.signal });
          clearTimeout(timer);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const arrayBuf = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          const urlExt = path.extname(new URL(candidateVideoUrl).pathname || '.mp4').toLowerCase() || '.mp4';
          const contentType = response.headers.get('content-type') || 'video/mp4';

          const uploaded = await this.uploadSingleMedia({
            file: {
              originalname: `${ex.slug}${urlExt}`,
              mimetype: contentType.split(';')[0].trim(),
              buffer,
            },
            exerciseIdOrSlug: ex.slug,
            mediaType: 'VIDEO',
            angle: 'front',
            targetMusclePart: legacy.targetMusclePart || '',
            notes: legacy.videoNotes || '',
            sourceUrl: candidateVideoUrl,
          });

          report.migratedFiles.push({
            exerciseSlug: ex.slug,
            from: candidateVideoUrl,
            toObjectKey: uploaded.objectKey,
            fileSize: uploaded.fileSize,
          });
        } catch (err) {
          report.externalPreservedReferences.push({
            exerciseSlug: ex.slug,
            sourceUrl: candidateVideoUrl,
            reason: `Remote fetch unavailable (${err.message}); original reference preserved intact.`,
          });
        }
      }
    }

    try {
      fs.writeFileSync(MIGRATION_REPORT_FILE, JSON.stringify(report, null, 2), 'utf8');
    } catch (_) {}

    return report;
  }
}

module.exports = {
  MediaService,
};
