// ============================================================================
// GYMGUIDE - CONSISTENT API RESPONSE INTERCEPTOR
// Wraps all successful controller responses in a uniform envelope
// ============================================================================

const { Injectable } = require('@nestjs/common');
const { map } = require('rxjs/operators');

@Injectable()
class ResponseTransformInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && payload.success !== undefined) {
          return payload;
        }

        if (payload && typeof payload === 'object' && payload.data !== undefined && payload.meta !== undefined) {
          return {
            success: true,
            data: payload.data,
            meta: payload.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: payload,
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}

module.exports = {
  ResponseTransformInterceptor,
};
