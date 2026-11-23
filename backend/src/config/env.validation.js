// ============================================================================
// GYMGUIDE - STARTUP ENVIRONMENT VARIABLE VALIDATION
// Enforces secure configuration and fails fast in production if secrets are weak
// ============================================================================

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

function loadAndValidateEnv() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const envFileCandidates = [
    path.resolve(process.cwd(), `.env.${nodeEnv}`),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', `.env.${nodeEnv}`),
    path.resolve(process.cwd(), '..', '.env'),
  ];

  for (const candidate of envFileCandidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      break;
    }
  }

  const minioPort = parseInt(process.env.MINIO_PORT || '9000', 10);
  const minioUseSsl = process.env.MINIO_USE_SSL === 'true';
  const minioEndpointHost = process.env.MINIO_ENDPOINT || 'localhost';
  const minioInternalUrl = `${minioUseSsl ? 'https' : 'http'}://${minioEndpointHost}:${
    Number.isNaN(minioPort) ? 9000 : minioPort
  }`;

  const config = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '4000', 10),
    API_PREFIX: process.env.API_PREFIX || 'api/v1',
    CORS_ORIGINS: (
      process.env.CORS_ORIGINS ||
      'http://localhost:5173,http://localhost:4173,http://localhost:8080,http://127.0.0.1:5173'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    DATABASE_URL:
      process.env.DATABASE_URL ||
      'postgresql://gymguide_app:dev_only_local_password_change_in_prod@localhost:5432/gymguide_dev?schema=public',
    RATE_LIMIT_TTL_MS: Math.max(1000, parseInt(process.env.RATE_LIMIT_TTL_MS || '60000', 10)),
    RATE_LIMIT_MAX_REQUESTS: Math.max(10, parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '150', 10)),
    BODY_LIMIT_KB: Math.min(512, Math.max(10, parseInt(process.env.BODY_LIMIT_KB || '100', 10))),
    JWT_ACCESS_SECRET:
      process.env.JWT_ACCESS_SECRET || 'dev_local_access_secret_key_do_not_use_in_production_2026',
    JWT_REFRESH_SECRET:
      process.env.JWT_REFRESH_SECRET || 'dev_local_refresh_secret_key_do_not_use_in_production_2026',
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    COOKIE_SECURE: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
    MINIO_ENDPOINT: minioEndpointHost,
    MINIO_PORT: Number.isNaN(minioPort) ? 9000 : minioPort,
    MINIO_CONSOLE_PORT: parseInt(process.env.MINIO_CONSOLE_PORT || '9001', 10),
    MINIO_INTERNAL_ENDPOINT: minioInternalUrl,
    MINIO_PUBLIC_ENDPOINT: process.env.MINIO_PUBLIC_ENDPOINT || minioInternalUrl,
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || '',
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || '',
    MINIO_BUCKET: (process.env.MINIO_BUCKET || 'gymguide-media').trim().toLowerCase(),
    MINIO_USE_SSL: minioUseSsl,
    MINIO_REGION: process.env.MINIO_REGION || 'us-east-1',
    MINIO_PRESIGNED_EXPIRY_SEC: Math.min(
      3600,
      Math.max(60, parseInt(process.env.MINIO_PRESIGNED_EXPIRY_SEC || '900', 10))
    ),
    MEDIA_STREAM_SECRET:
      process.env.MEDIA_STREAM_SECRET ||
      process.env.JWT_ACCESS_SECRET ||
      'dev_local_media_stream_secret_do_not_use_in_production_2026',
    MAX_IMAGE_UPLOAD_MB: Math.min(25, Math.max(1, parseInt(process.env.MAX_IMAGE_UPLOAD_MB || '10', 10))),
    MAX_VIDEO_UPLOAD_MB: Math.min(500, Math.max(5, parseInt(process.env.MAX_VIDEO_UPLOAD_MB || '100', 10))),
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || '',
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || '',
  };

  if (Number.isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error('Invalid PORT environment variable. Must be an integer between 1 and 65535.');
  }

  // Strict production secret checks
  if (config.NODE_ENV === 'production') {
    const insecurePlaceholders = ['CHANGE_ME', '__INJECT_VIA_SECRET_MANAGER__', 'dev_local_'];
    for (const key of [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
      'MINIO_ACCESS_KEY',
      'MINIO_SECRET_KEY',
    ]) {
      const value = config[key] || '';
      if (!value || insecurePlaceholders.some((p) => value.includes(p))) {
        throw new Error(
          `[SECURITY FATAL] Production environment variable ${key} is missing or uses a default placeholder.`
        );
      }
    }
    if (config.DATABASE_URL.includes('postgres:') && config.DATABASE_URL.includes('@')) {
      console.warn('[SECURITY WARNING] Avoid using the default postgres superuser in production.');
    }
  }

  return config;
}

const APP_CONFIG = loadAndValidateEnv();

module.exports = {
  loadAndValidateEnv,
  APP_CONFIG,
};
