// ============================================================================
// GYMGUIDE - DTO REQUEST VALIDATION PIPE (Pure JavaScript NestJS Pipe)
// Enforces schema rules, field whitelisting (anti-mass-assignment), and sanitization
// ============================================================================

const { BadRequestException, Injectable } = require('@nestjs/common');
const { sanitizeString, pickAllowedFields } = require('./sanitize.util');

@Injectable()
class DtoValidationPipe {
  constructor(schema) {
    this.schema = schema || null;
  }

  transform(value) {
    if (!this.schema) {
      return value;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Request payload must be a valid JSON object.');
    }

    const allowedKeys = Object.keys(this.schema);
    const incomingKeys = Object.keys(value);
    const unexpectedKeys = incomingKeys.filter((k) => !allowedKeys.includes(k));

    if (unexpectedKeys.length > 0) {
      throw new BadRequestException(
        `Mass assignment rejected. Unexpected fields: ${unexpectedKeys.join(', ')}`
      );
    }

    const sanitizedData = pickAllowedFields(value, allowedKeys);
    const errors = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      let fieldVal = sanitizedData[field];

      if (rules.required && (fieldVal === undefined || fieldVal === null || fieldVal === '')) {
        errors.push(`Field '${field}' is required.`);
        continue;
      }

      if (fieldVal === undefined || fieldVal === null) {
        if (rules.default !== undefined) {
          sanitizedData[field] = rules.default;
        }
        continue;
      }

      if (rules.type === 'string') {
        if (typeof fieldVal !== 'string') {
          errors.push(`Field '${field}' must be a string.`);
          continue;
        }
        fieldVal = rules.skipHtmlStrip
          ? fieldVal.trim().slice(0, rules.maxLength || 256)
          : sanitizeString(fieldVal, rules.maxLength || 256);

        if (rules.minLength && fieldVal.length < rules.minLength) {
          errors.push(`Field '${field}' must be at least ${rules.minLength} characters.`);
        }
        if (rules.pattern && !rules.pattern.test(fieldVal)) {
          errors.push(rules.patternMessage || `Field '${field}' format is invalid.`);
        }
        if (rules.enum && !rules.enum.includes(fieldVal.toUpperCase())) {
          errors.push(`Field '${field}' must be one of: ${rules.enum.join(', ')}`);
        }
        sanitizedData[field] = fieldVal;
      } else if (rules.type === 'number') {
        const num = Number(fieldVal);
        if (Number.isNaN(num)) {
          errors.push(`Field '${field}' must be a valid number.`);
          continue;
        }
        if (rules.min !== undefined && num < rules.min) {
          errors.push(`Field '${field}' must be >= ${rules.min}.`);
        }
        if (rules.max !== undefined && num > rules.max) {
          errors.push(`Field '${field}' must be <= ${rules.max}.`);
        }
        sanitizedData[field] = num;
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return sanitizedData;
  }
}

module.exports = {
  DtoValidationPipe,
};
