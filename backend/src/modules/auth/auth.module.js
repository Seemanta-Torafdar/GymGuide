// ============================================================================
// GYMGUIDE - AUTHENTICATION MODULE (Optional User Accounts & Admin Security)
// Implements:
//   - bcrypt (cost 12) password hashing
//   - Brute-force lockout protection after 5 failed attempts
//   - Short-lived Access Tokens (15m) & Rotating Refresh Tokens (7d)
//   - HttpOnly, Secure, SameSite cookies (never stored in localStorage)
//   - Token revocation on logout
// ============================================================================

const {
  Injectable,
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  Bind,
  Dependencies,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Module,
} = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaService } = require('../../database/prisma.service');
const { APP_CONFIG } = require('../../config/env.validation');
const { DtoValidationPipe } = require('../../common/dto-validator.pipe');
const { JwtAuthGuard } = require('../../guards/jwt-auth.guard');

const REGISTER_SCHEMA = {
  email: {
    type: 'string',
    required: true,
    maxLength: 120,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: 'Please enter a valid email address.',
  },
  password: {
    type: 'string',
    required: true,
    minLength: 8,
    maxLength: 72,
    skipHtmlStrip: true,
  },
  displayName: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 60,
  },
};

const LOGIN_SCHEMA = {
  email: {
    type: 'string',
    required: true,
    maxLength: 120,
  },
  password: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 72,
    skipHtmlStrip: true,
  },
};

@Injectable()
@Dependencies(PrismaService)
class AuthService {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  async _findUserByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.user.findUnique({ where: { email: cleanEmail } });
    }
    return this.prisma.memoryStore.users.get(cleanEmail) || null;
  }

  async _saveUser(user) {
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.user.upsert({
        where: { email: user.email },
        update: {
          passwordHash: user.passwordHash,
          displayName: user.displayName,
          role: user.role,
          refreshTokenHash: user.refreshTokenHash,
          failedLoginCount: user.failedLoginCount || 0,
          lockedUntil: user.lockedUntil || null,
        },
        create: user,
      });
    }
    this.prisma.memoryStore.users.set(user.email, user);
    return user;
  }

  _issueTokens(user) {
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      APP_CONFIG.JWT_ACCESS_SECRET,
      { expiresIn: APP_CONFIG.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        jti: crypto.randomUUID(),
      },
      APP_CONFIG.JWT_REFRESH_SECRET,
      { expiresIn: APP_CONFIG.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  attachAuthCookies(res, tokens) {
    const commonCookieOpts = {
      httpOnly: true,
      secure: APP_CONFIG.COOKIE_SECURE,
      sameSite: APP_CONFIG.COOKIE_SAME_SITE,
      path: '/',
    };

    res.cookie('gymguide_access_token', tokens.accessToken, {
      ...commonCookieOpts,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('gymguide_refresh_token', tokens.refreshToken, {
      ...commonCookieOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearAuthCookies(res) {
    res.clearCookie('gymguide_access_token', { path: '/' });
    res.clearCookie('gymguide_refresh_token', { path: '/' });
  }

  async register(dto) {
    const payload = new DtoValidationPipe(REGISTER_SCHEMA).transform(dto);
    const email = payload.email.toLowerCase();

    const existing = await this._findUserByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const newUser = {
      id: `usr-${crypto.randomUUID()}`,
      email,
      passwordHash,
      displayName: payload.displayName,
      role: 'USER',
      refreshTokenHash: null,
      failedLoginCount: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const tokens = this._issueTokens(newUser);
    newUser.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this._saveUser(newUser);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
      },
      tokens,
    };
  }

  async login(dto) {
    const payload = new DtoValidationPipe(LOGIN_SCHEMA).transform(dto);
    const email = payload.email.toLowerCase();
    const user = await this._findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    // Brute-force lockout check
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const waitMins = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      throw new ForbiddenException(
        `Account temporarily locked due to multiple failed login attempts. Try again in ${waitMins} minutes.`
      );
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      if (user.failedLoginCount >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15-min lockout
      }
      await this._saveUser(user);
      throw new UnauthorizedException('Invalid email or password.');
    }

    user.failedLoginCount = 0;
    user.lockedUntil = null;
    const tokens = this._issueTokens(user);
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this._saveUser(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided.');
    }
    try {
      const decoded = jwt.verify(refreshToken, APP_CONFIG.JWT_REFRESH_SECRET);
      const user = await this._findUserByEmail(decoded.email);
      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Session revoked. Please sign in again.');
      }

      const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!matches) {
        // Rotating refresh token replay detection: invalidate session
        user.refreshTokenHash = null;
        await this._saveUser(user);
        throw new UnauthorizedException('Invalid refresh token.');
      }

      const tokens = this._issueTokens(user);
      user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
      await this._saveUser(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        tokens,
      };
    } catch (err) {
      throw new UnauthorizedException('Expired or invalid refresh token.');
    }
  }

  async logout(email) {
    if (!email) return;
    const user = await this._findUserByEmail(email);
    if (user) {
      user.refreshTokenHash = null;
      await this._saveUser(user);
    }
  }
}

@ApiTags('Authentication')
@Controller('auth')
@Dependencies(AuthService)
class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  @Post('register')
  @Bind(Body(), Res({ passthrough: true }))
  @ApiOperation({ summary: 'Register a new user account with HttpOnly cookie tokens' })
  async register(body, res) {
    const { user, tokens } = await this.authService.register(body);
    this.authService.attachAuthCookies(res, tokens);
    return {
      message: 'Registration successful.',
      user,
    };
  }

  @Post('login')
  @Bind(Body(), Res({ passthrough: true }))
  @ApiOperation({ summary: 'Authenticate user and issue short-lived HttpOnly cookies' })
  async login(body, res) {
    const { user, tokens } = await this.authService.login(body);
    this.authService.attachAuthCookies(res, tokens);
    return {
      message: 'Authenticated successfully.',
      user,
    };
  }

  @Post('refresh')
  @Bind(Req(), Res({ passthrough: true }))
  @ApiOperation({ summary: 'Rotate refresh token and issue a new short-lived access token' })
  async refresh(req, res) {
    const refreshToken = req.cookies ? req.cookies.gymguide_refresh_token : null;
    const { user, tokens } = await this.authService.refreshTokens(refreshToken);
    this.authService.attachAuthCookies(res, tokens);
    return {
      message: 'Session tokens rotated.',
      user,
    };
  }

  @Post('logout')
  @Bind(Req(), Res({ passthrough: true }))
  @ApiOperation({ summary: 'Revoke refresh token and clear HttpOnly auth cookies' })
  async logout(req, res) {
    if (req.user && req.user.email) {
      await this.authService.logout(req.user.email);
    }
    this.authService.clearAuthCookies(res);
    return {
      message: 'Logged out and session revoked.',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Bind(Req())
  @ApiOperation({ summary: 'Get currently authenticated user profile' })
  async getMe(req) {
    return {
      user: req.user,
    };
  }
}

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
class AuthModule {}

module.exports = {
  AuthService,
  AuthController,
  AuthModule,
};
