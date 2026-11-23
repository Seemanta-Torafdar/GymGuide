// ============================================================================
// GYMGUIDE - NESTJS MEDIA MODULE (MinIO Object Storage + Metadata Service)
// ============================================================================

const { Module, Global } = require('@nestjs/common');
const { MinioStorageService } = require('./minio-storage.service');
const { MediaService } = require('./media.service');
const { MediaController } = require('./media.controller');

@Global()
@Module({
  controllers: [MediaController],
  providers: [MinioStorageService, MediaService],
  exports: [MinioStorageService, MediaService],
})
class MediaModule {}

module.exports = {
  MediaModule,
};
