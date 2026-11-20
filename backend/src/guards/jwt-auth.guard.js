// ============================================================================
// GYMGUIDE - JWT AUTHENTICATION & ADMIN ROLE GUARDS
// Prefers HttpOnly Secure SameSite Cookies; supports Bearer Authorization fallback
// ============================================================================

const {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} = require('@nestjs/common');
const jwt = require('jsonwebtoken');
const { APP_CONFIG } = require('../config/env.validation');

const ROLES_KEY = 'gymguide_roles';
const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);

@Injectable()
class JwtAuthGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    let token = null;

    // 1. Prefer HttpOnly Cookie (gymguide_access_token)
    if (request.cookies && request.cookies.gymguide_access_token) {
      token = request.cookies.gymguide_access_token;
    } else if (
      request.headers &&
      request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer ')
    ) {
      // 2. Fallback to Bearer token header for API clients
      token = request.headers.authorization.slice(7).trim();
    }

    if (!token) {
      throw new UnauthorizedException('Authentication required. No active session token found.');
    }

    try {
      const payload = jwt.verify(token, APP_CONFIG.JWT_ACCESS_SECRET);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role || 'USER',
        displayName: payload.displayName,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}

@Injectable()
class AdminRoleGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (request.user.role !== 'ADMIN') {
      throw new ForbiddenException('Restricted action. Administrator privileges required.');
    }
    return true;
  }
}

module.exports = {
  JwtAuthGuard,
  AdminRoleGuard,
  Roles,
  ROLES_KEY,
};
