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
  };

  if (Number.isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error('Invalid PORT environment variable. Must be an integer between 1 and 65535.');
  }

  // Strict production secret checks
  if (config.NODE_ENV === 'production') {
    const insecurePlaceholders = ['CHANGE_ME', '__INJECT_VIA_SECRET_MANAGER__', 'dev_local_'];
    for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL']) {
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
