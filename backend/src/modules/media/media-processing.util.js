// ============================================================================
// GYMGUIDE - MEDIA VALIDATION & IMAGE/VIDEO PROCESSING UTILITIES
// Enforces MIME types, magic bytes, file sizes & non-distorting WebP conversion
// ============================================================================

const path = require('path');
const sharp = require('sharp');
const { BadRequestException } = require('@nestjs/common');
const { APP_CONFIG } = require('../../config/env.validation');

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

function hasValidImageMagicBytes(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return false;
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng =
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isWebp =
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

function hasValidVideoMagicBytes(buf, ext) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return false;
  if (ext === '.webm') {
    return buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
  }
  // ISO Base Media File Format (.mp4 / .mov): 'ftyp' box within first 12 bytes
  return buf.subarray(4, 8).toString('ascii') === 'ftyp';
}

function validateFilenameAndExtension(originalName = '', allowedExts) {
  const safeName = path.basename(String(originalName || 'upload')).replace(/[^\w.\-() ]+/g, '_');
  const ext = path.extname(safeName).toLowerCase();
  if (!allowedExts.has(ext)) {
    throw new BadRequestException(
      `Unsupported file extension "${ext || 'none'}". Allowed: ${Array.from(allowedExts).join(', ')}`
    );
  }
  return { safeName, ext };
}

/**
 * Validates and optimizes an exercise instructional image into WebP without distorting anatomy
 */
async function validateAndOptimizeImage(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new BadRequestException('Image file buffer is empty.');
  }

  const maxBytes = (APP_CONFIG.MAX_IMAGE_UPLOAD_MB || 10) * 1024 * 1024;
  if (file.buffer.length > maxBytes) {
    throw new BadRequestException(
      `Image file exceeds maximum allowed size of ${APP_CONFIG.MAX_IMAGE_UPLOAD_MB || 10} MB.`
    );
  }

  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(mime)) {
    throw new BadRequestException(
      `Unsupported image MIME type "${mime}". Allowed: JPEG, PNG, WebP.`
    );
  }

  const { safeName } = validateFilenameAndExtension(file.originalname, ALLOWED_IMAGE_EXTS);
  if (!hasValidImageMagicBytes(file.buffer)) {
    throw new BadRequestException(
      'Uploaded image failed binary signature validation (invalid JPEG/PNG/WebP header).'
    );
  }

  try {
    const { data, info } = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1280,
        height: 1280,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    return {
      buffer: data,
      mimeType: 'image/webp',
      ext: '.webp',
      fileSize: data.length,
      width: info.width || null,
      height: info.height || null,
      originalFilename: safeName,
    };
  } catch (err) {
    throw new BadRequestException(`Could not process image into WebP: ${err.message}`);
  }
}

/**
 * Validates an exercise demonstration video while preserving existing MP4/H.264 streams
 */
function validateVideoUpload(file) {
  if (!file || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new BadRequestException('Video file buffer is empty.');
  }

  const maxBytes = (APP_CONFIG.MAX_VIDEO_UPLOAD_MB || 100) * 1024 * 1024;
  if (file.buffer.length > maxBytes) {
    throw new BadRequestException(
      `Video file exceeds maximum allowed size of ${APP_CONFIG.MAX_VIDEO_UPLOAD_MB || 100} MB.`
    );
  }

  const mime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_VIDEO_MIMES.has(mime)) {
    throw new BadRequestException(
      `Unsupported video MIME type "${mime}". Allowed: MP4 (video/mp4), WebM (video/webm), MOV (video/quicktime).`
    );
  }

  const { safeName, ext } = validateFilenameAndExtension(file.originalname, ALLOWED_VIDEO_EXTS);
  if (!hasValidVideoMagicBytes(file.buffer, ext)) {
    throw new BadRequestException(
      `Uploaded video failed binary container validation for "${ext}". Ensure valid MP4/H.264, WebM, or MOV.`
    );
  }

  const normalizedMime =
    ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'video/quicktime';

  return {
    buffer: file.buffer,
    mimeType: normalizedMime,
    ext,
    fileSize: file.buffer.length,
    width: null,
    height: null,
    originalFilename: safeName,
  };
}

module.exports = {
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  validateAndOptimizeImage,
  validateVideoUpload,
};
