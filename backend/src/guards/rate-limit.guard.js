// ============================================================================
// GYMGUIDE - RATE LIMIT & REQUEST THROTTLING GUARD
// Sliding-window IP rate limiter with steeper limits on auth routes
// ============================================================================

const { Injectable, HttpException, HttpStatus } = require('@nestjs/common');
const { APP_CONFIG } = require('../config/env.validation');

@Injectable()
class RateLimitGuard {
  constructor() {
    this.buckets = new Map();
    this.ttlMs = APP_CONFIG.RATE_LIMIT_TTL_MS || 60000;
    this.maxRequests = APP_CONFIG.RATE_LIMIT_MAX_REQUESTS || 150;
    this.authMaxRequests = 20;

    // Periodic memory cleanup
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.buckets.entries()) {
        if (now > record.resetAt) {
          this.buckets.delete(key);
        }
      }
    }, 60000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  canActivate(context) {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    if (!req) return true;

    const ip =
      (req.headers && req.headers['x-forwarded-for']
        ? String(req.headers['x-forwarded-for']).split(',')[0].trim()
        : null) ||
      req.ip ||
      (req.socket && req.socket.remoteAddress) ||
      'unknown';

    const pathUrl = req.originalUrl || req.url || '';
    const isAuthRoute = pathUrl.includes('/auth/');
    const limit = isAuthRoute ? this.authMaxRequests : this.maxRequests;
    const bucketKey = `${ip}:${isAuthRoute ? 'auth' : 'api'}`;

    const now = Date.now();
    let record = this.buckets.get(bucketKey);

    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + this.ttlMs,
      };
      this.buckets.set(bucketKey, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, limit - record.count);
    const resetSeconds = Math.ceil((record.resetAt - now) / 1000);

    if (res && typeof res.setHeader === 'function') {
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(resetSeconds));
    }

    if (record.count > limit) {
      if (res && typeof res.setHeader === 'function') {
        res.setHeader('Retry-After', String(resetSeconds));
      }
      throw new HttpException(
        {
          message: `Too many requests from this IP. Please retry in ${resetSeconds} seconds.`,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}

module.exports = {
  RateLimitGuard,
};
