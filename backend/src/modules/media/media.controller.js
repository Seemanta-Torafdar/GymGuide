// ============================================================================
// GYMGUIDE - MEDIA CONTROLLER (MinIO Private Storage + Signed URL Delivery)
// Protected write/delete/migrate endpoints with JwtAuthGuard + AdminRoleGuard
// Exposed at both /api/v1/media/* and /api/media/*
// ============================================================================

const multer = require('multer');
const {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Bind,
  Dependencies,
} = require('@nestjs/common');
const { FileInterceptor, FilesInterceptor } = require('@nestjs/platform-express');
const { ApiTags, ApiOperation, ApiBearerAuth } = require('@nestjs/swagger');
const { JwtAuthGuard, AdminRoleGuard } = require('../../guards/jwt-auth.guard');
const { APP_CONFIG } = require('../../config/env.validation');
const { MediaService } = require('./media.service');
const { MinioStorageService } = require('./minio-storage.service');

const MAX_MULTIPART_BYTES = (APP_CONFIG.MAX_VIDEO_UPLOAD_MB || 100) * 1024 * 1024;
const MULTER_MEMORY_OPTS = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_MULTIPART_BYTES,
    files: 10,
  },
};

@ApiTags('MinIO Object Storage Media')
@Controller('media')
@Dependencies(MediaService, MinioStorageService)
class MediaController {
  constructor(mediaService, minioStorage) {
    this.mediaService = mediaService;
    this.minioStorage = minioStorage;
  }

  @Get('status')
  @ApiOperation({ summary: 'Check MinIO bucket readiness and connection health (no credentials exposed)' })
  async getStatus() {
    return this.minioStorage.getHealthStatus();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get 69-exercise media coverage matrix (video + 4 instructional steps)' })
  async getOverview() {
    return this.mediaService.getAdminMediaOverview();
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @UseInterceptors(FileInterceptor('file', MULTER_MEMORY_OPTS))
  @Bind(Req(), Body())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Upload single exercise video or instructional step image to MinIO' })
  async uploadSingle(req, body) {
    return this.mediaService.uploadSingleMedia({
      file: req.file,
      exerciseIdOrSlug: body.exerciseId || body.exerciseSlug || body.slug,
      mediaType: body.mediaType,
      stepNumber: body.stepNumber,
      angle: body.angle,
      targetMusclePart: body.targetMusclePart,
      notes: body.notes,
      sourceUrl: body.sourceUrl,
    });
  }

  @Post('upload-multiple')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @UseInterceptors(FilesInterceptor('files', 10, MULTER_MEMORY_OPTS))
  @Bind(Req(), Body())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Upload multiple instructional images/videos together into MinIO' })
  async uploadMultiple(req, body) {
    return this.mediaService.uploadMultipleMedia(req.files || [], body);
  }

  @Post('migrate')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Bind(Body())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Trigger resumable migration of legacy media files into MinIO' })
  async migrateLegacyMedia(body) {
    return this.mediaService.migrateLegacyMedia(body || {});
  }

  @Get('exercise/:exerciseId')
  @Bind(Param('exerciseId'))
  @ApiOperation({ summary: 'Retrieve exercise video and 4 instructional image metadata + signed URLs' })
  async getByExercise(exerciseId) {
    return this.mediaService.getMediaByExercise(exerciseId);
  }

  @Get(':id/url')
  @Bind(Param('id'), Query('expiresIn'))
  @ApiOperation({ summary: 'Generate short-lived signed download URL and seekable stream URL' })
  async getSignedUrl(id, expiresIn) {
    return this.mediaService.getSignedMediaUrl(id, expiresIn);
  }

  @Get(':id/stream')
  @Bind(Param('id'), Query(), Req(), Res())
  @ApiOperation({ summary: 'Stream private MinIO media with HMAC signature verification & HTTP 206 byte ranges' })
  async streamMedia(id, query, req, res) {
    return this.mediaService.streamMedia(id, query || {}, req.headers?.range || null, res);
  }

  @Get(':id')
  @Bind(Param('id'))
  @ApiOperation({ summary: 'Get single media metadata record and signed URL' })
  async getOne(id) {
    return this.mediaService.getMediaById(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @Bind(Param('id'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete media object from MinIO and metadata record from PostgreSQL' })
  async removeMedia(id) {
    return this.mediaService.deleteMedia(id);
  }
}

module.exports = {
  MediaController,
};
