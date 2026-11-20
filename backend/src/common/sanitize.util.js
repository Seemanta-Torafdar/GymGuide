// ============================================================================
// GYMGUIDE - INPUT SANITIZATION & SECURITY UTILITIES
// Protects against XSS, HTML injection, prototype pollution, and mass assignment
// ============================================================================

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Strips HTML tags, control characters, and null bytes from untrusted strings
 */
function sanitizeString(input, maxLength = 256) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitizes an identifier or slug (alphanumeric, hyphens, underscores only)
 */
function sanitizeSlugOrId(input, maxLength = 80) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, maxLength);
}

/**
 * Protects against mass assignment and prototype pollution by picking only allowed fields
 */
function pickAllowedFields(source, allowedFields = []) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {};
  }
  const clean = {};
  for (const field of allowedFields) {
    if (
      !DANGEROUS_KEYS.has(field) &&
      Object.prototype.hasOwnProperty.call(source, field) &&
      source[field] !== undefined
    ) {
      clean[field] = source[field];
    }
  }
  return clean;
}

/**
 * Parses and clamps pagination parameters safely
 */
function parsePagination(query = {}, defaults = { page: 1, limit: 20, maxLimit: 60 }) {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit, 10);

  const page = !Number.isNaN(rawPage) && rawPage > 0 ? Math.min(rawPage, 1000) : defaults.page;
  const limit =
    !Number.isNaN(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, defaults.maxLimit || 60)
      : defaults.limit;

  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

module.exports = {
  sanitizeString,
  sanitizeSlugOrId,
  pickAllowedFields,
  parsePagination,
};
