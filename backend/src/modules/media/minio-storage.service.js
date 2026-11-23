// ============================================================================
// GYMGUIDE - REUSABLE MINIO S3 OBJECT STORAGE SERVICE
// Wraps @aws-sdk/client-s3 & @aws-sdk/s3-request-presigner for private media
// Never exposes storage credentials to callers or error payloads.
// ============================================================================

const { Injectable } = require('@nestjs/common');
const {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { APP_CONFIG } = require('../../config/env.validation');
const { sanitizeSlugOrId } = require('../../common/sanitize.util');

const STEP_OBJECT_FILENAMES = {
  1: 'step-01-starting.webp',
  2: 'step-02-movement.webp',
  3: 'step-03-contraction.webp',
  4: 'step-04-return-muscle.webp',
};

const VALID_CATEGORY_FOLDERS = new Set([
  'chest',
  'shoulders',
  'back',
  'legs',
  'glutes',
  'calves',
  'biceps',
  'triceps',
  'forearms',
  'abs',
]);

@Injectable()
class MinioStorageService {
  constructor() {
    this.bucket = APP_CONFIG.MINIO_BUCKET || 'gymguide-media';
    this.region = APP_CONFIG.MINIO_REGION || 'us-east-1';
    this.internalEndpoint = APP_CONFIG.MINIO_INTERNAL_ENDPOINT;
    this.publicEndpoint = APP_CONFIG.MINIO_PUBLIC_ENDPOINT || this.internalEndpoint;
    this.isConfigured = Boolean(
      APP_CONFIG.MINIO_ACCESS_KEY && APP_CONFIG.MINIO_SECRET_KEY
    );
    this.isConnected = false;
    this.lastError = null;

    if (this.isConfigured) {
      const credentials = {
        accessKeyId: APP_CONFIG.MINIO_ACCESS_KEY,
        secretAccessKey: APP_CONFIG.MINIO_SECRET_KEY,
      };
      this.client = new S3Client({
        region: this.region,
        endpoint: this.internalEndpoint,
        forcePathStyle: true,
        credentials,
        maxAttempts: 2,
      });
      this.signerClient = new S3Client({
        region: this.region,
        endpoint: this.publicEndpoint,
        forcePathStyle: true,
        credentials,
        maxAttempts: 1,
      });
    } else {
      this.client = null;
      this.signerClient = null;
      this.lastError = 'MinIO credentials are not configured.';
    }
  }

  async onModuleInit() {
    if (!this.client) return;
    try {
      await Promise.race([
        this.ensureBucketExists(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MinIO connection check timeout (2000ms)')), 2000)
        ),
      ]);
      this.isConnected = true;
      this.lastError = null;
      console.log(
        `✅ Connected to MinIO Object Storage (${this.internalEndpoint}, private bucket: "${this.bucket}").`
      );
    } catch (err) {
      this.isConnected = false;
      this.lastError = this._safeErrorMessage(err);
      console.log(
        `ℹ️ MinIO Object Storage unreachable at startup (${this.lastError}). Media uploads will stay unavailable until MinIO is online.`
      );
    }
  }

  _safeErrorMessage(err) {
    const raw = (err && (err.message || err.code || err.name)) || 'Storage error';
    return String(raw)
      .replace(APP_CONFIG.MINIO_ACCESS_KEY || '__NONE__', '[REDACTED]')
      .replace(APP_CONFIG.MINIO_SECRET_KEY || '__NONE__', '[REDACTED]');
  }

  /**
   * Generates a canonical, path-traversal-proof object key inside gymguide-media/exercises/...
   */
  buildExerciseObjectKey(category, exerciseSlug, options = {}) {
    const rawCat = sanitizeSlugOrId(category || 'chest', 32) || 'chest';
    const catFolder = VALID_CATEGORY_FOLDERS.has(rawCat) ? rawCat : 'chest';
    const cleanSlug = sanitizeSlugOrId(exerciseSlug || '', 96);
    if (!cleanSlug) {
      throw new Error('Cannot build storage key without a valid exercise slug.');
    }

    const mediaType = String(options.mediaType || '').toUpperCase();
    if (mediaType === 'IMAGE') {
      const stepNum = parseInt(options.stepNumber, 10);
      const stepFilename = STEP_OBJECT_FILENAMES[stepNum];
      if (!stepFilename) {
        throw new Error('Instructional image stepNumber must be between 1 and 4.');
      }
      return `exercises/${catFolder}/${cleanSlug}/${stepFilename}`;
    }

    const cleanAngle = sanitizeSlugOrId(options.angle || 'front', 16) || 'front';
    const rawExt = String(options.ext || '.mp4').toLowerCase();
    const safeExt = ['.mp4', '.webm', '.mov'].includes(rawExt) ? rawExt : '.mp4';
    const videoFilename =
      cleanAngle === 'front' ? `video${safeExt}` : `video-${cleanAngle}${safeExt}`;
    return `exercises/${catFolder}/${cleanSlug}/${videoFilename}`;
  }

  async ensureBucketExists() {
    if (!this.client) {
      throw new Error('MinIO client is not configured.');
    }
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.isConnected = true;
      this.lastError = null;
      return { bucket: this.bucket, created: false };
    } catch (err) {
      const code = err?.$metadata?.httpStatusCode;
      const errName = err?.name || err?.Code || '';
      if (code === 404 || errName === 'NotFound' || errName === 'NoSuchBucket') {
        await this.client.send(
          new CreateBucketCommand({
            Bucket: this.bucket,
          })
        );
        this.isConnected = true;
        this.lastError = null;
        return { bucket: this.bucket, created: true };
      }
      this.isConnected = false;
      this.lastError = this._safeErrorMessage(err);
      throw new Error(`MinIO bucket check failed: ${this.lastError}`);
    }
  }

  async getHealthStatus() {
    if (!this.client) {
      return {
        engine: 'minio',
        configured: false,
        connected: false,
        bucket: this.bucket,
        error: 'MinIO credentials missing in backend environment.',
      };
    }
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.isConnected = true;
      this.lastError = null;
      return {
        engine: 'minio',
        configured: true,
        connected: true,
        bucket: this.bucket,
        region: this.region,
      };
    } catch (err) {
      this.isConnected = false;
      this.lastError = this._safeErrorMessage(err);
      return {
        engine: 'minio',
        configured: true,
        connected: false,
        bucket: this.bucket,
        region: this.region,
        error: this.lastError,
      };
    }
  }

  async uploadObject({ objectKey, buffer, contentType, metadata = {} }) {
    await this.ensureBucketExists();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        ContentLength: buffer.length,
        Metadata: metadata,
      })
    );
    return {
      bucket: this.bucket,
      objectKey,
      contentType,
      size: buffer.length,
    };
  }

  async headObject(objectKey) {
    if (!this.client) return null;
    try {
      const res = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        })
      );
      return {
        exists: true,
        contentLength: res.ContentLength || 0,
        contentType: res.ContentType || 'application/octet-stream',
        eTag: res.ETag || null,
        lastModified: res.LastModified || null,
      };
    } catch (err) {
      const status = err?.$metadata?.httpStatusCode;
      if (status === 404 || err?.name === 'NotFound') {
        return null;
      }
      throw new Error(`MinIO headObject failed: ${this._safeErrorMessage(err)}`);
    }
  }

  async objectExists(objectKey) {
    const info = await this.headObject(objectKey);
    return Boolean(info && info.exists);
  }

  async getObjectStream(objectKey, rangeHeader = null) {
    if (!this.client) {
      throw new Error('MinIO client is not configured.');
    }
    const params = {
      Bucket: this.bucket,
      Key: objectKey,
    };
    if (rangeHeader) {
      params.Range = rangeHeader;
    }
    const res = await this.client.send(new GetObjectCommand(params));
    return {
      stream: res.Body,
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength,
      contentRange: res.ContentRange || null,
      acceptRanges: res.AcceptRanges || 'bytes',
      statusCode: res.ContentRange ? 206 : 200,
    };
  }

  async getSignedDownloadUrl(objectKey, expiresInSeconds = APP_CONFIG.MINIO_PRESIGNED_EXPIRY_SEC) {
    const signer = this.signerClient || this.client;
    if (!signer) return null;
    const ttl = Math.min(3600, Math.max(60, Number(expiresInSeconds) || 900));
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    return getSignedUrl(signer, command, { expiresIn: ttl });
  }

  async deleteObject(objectKey) {
    if (!this.client || !objectKey) return false;
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      })
    );
    return true;
  }

  async listObjects(prefix = 'exercises/') {
    if (!this.client) return [];
    const items = [];
    let continuationToken = undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      if (Array.isArray(res.Contents)) {
        items.push(...res.Contents);
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);
    return items;
  }
}

module.exports = {
  MinioStorageService,
  STEP_OBJECT_FILENAMES,
};
