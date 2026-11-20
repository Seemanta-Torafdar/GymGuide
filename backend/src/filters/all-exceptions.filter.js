// ============================================================================
// GYMGUIDE - CENTRALIZED EXCEPTION FILTER
// Prevents stack-trace or database credential leaks in API responses
// ============================================================================

const { Catch, HttpException, HttpStatus } = require('@nestjs/common');

@Catch()
class AllExceptionsFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'An unexpected server error occurred.';
    let validationErrors = undefined;

    if (isHttpException) {
      const resBody = exception.getResponse();
      if (typeof resBody === 'string') {
        message = resBody;
      } else if (resBody && typeof resBody === 'object') {
        message = resBody.message || message;
        if (Array.isArray(resBody.errors)) {
          validationErrors = resBody.errors;
        }
      }
    } else if (process.env.NODE_ENV !== 'production' && exception && exception.message) {
      // Mask any connection strings if present in error messages
      message = exception.message.replace(/postgresql:\/\/[^\s]+/gi, 'postgresql://[REDACTED]');
    }

    const safePayload = {
      success: false,
      statusCode: status,
      error: HttpStatus[status] || 'ERROR',
      message,
      ...(validationErrors ? { errors: validationErrors } : {}),
      path: request ? request.originalUrl || request.url : undefined,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(safePayload);
  }
}

module.exports = {
  AllExceptionsFilter,
};
