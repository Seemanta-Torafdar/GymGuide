// ============================================================================
// GYMGUIDE - NESTJS BACKEND ENTRY POINT (JavaScript ES6+)
// Configures Helmet, CORS allowlisting, payload size limits, static video hosting & Swagger
// ============================================================================

require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { AppModule } = require('./app.module');
const { APP_CONFIG } = require('./config/env.validation');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: false,
  });

  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.disable('x-powered-by');

  // Ensure local video uploads directory exists and serve /uploads statically
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      maxAge: '7d',
      setHeaders: (res) => {
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    })
  );

  // 1. Request Body Size Limits (50MB for Admin Video File upload, 100KB for standard API routes)
  const standardLimitStr = `${APP_CONFIG.BODY_LIMIT_KB}kb`;
  app.use('/api/v1/exercises/:id/video-file', express.json({ limit: '50mb' }));
  app.use(express.json({ limit: standardLimitStr }));
  app.use(express.urlencoded({ extended: true, limit: standardLimitStr }));
  app.use(cookieParser());
  app.use(compression());

  // 2. Secure HTTP Headers via Helmet (allowing self & embedded demonstration videos)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          mediaSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          frameSrc: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // 3. Strict CORS Allowlisting
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || APP_CONFIG.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      if (APP_CONFIG.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by GymGuide CORS policy.`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  });

  // 4. Secure API Versioning Prefix (/api/v1)
  app.setGlobalPrefix(APP_CONFIG.API_PREFIX);

  // 5. OpenAPI / Swagger Documentation at /api/docs
  const controllers = [
    require('./modules/health/health.module').HealthController,
    require('./modules/muscles/muscles.module').MusclesController,
    require('./modules/exercises/exercises.module').ExercisesController,
    require('./modules/equipment/equipment.module').EquipmentController,
    require('./modules/workout-plans/workout-plans.module').WorkoutPlansController,
    require('./modules/search/search.module').SearchController,
    require('./modules/auth/auth.module').AuthController,
    require('./modules/users/users.module').UsersController,
  ];
  for (const Ctrl of controllers) {
    if (!Ctrl || !Ctrl.prototype) continue;
    for (const key of Object.getOwnPropertyNames(Ctrl.prototype)) {
      if (key === 'constructor') continue;
      const descriptor = Object.getOwnPropertyDescriptor(Ctrl.prototype, key);
      if (descriptor && typeof descriptor.value === 'function') {
        const existing = Reflect.getMetadata('design:paramtypes', Ctrl.prototype, key);
        if (!existing) {
          Reflect.defineMetadata(
            'design:paramtypes',
            new Array(Math.max(descriptor.value.length, 4)).fill(Object),
            Ctrl.prototype,
            key
          );
        }
      }
    }
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GymGuide REST API')
    .setDescription(
      'Interactive Muscle Explorer, Exercise Video Studio & Workout Learning Platform API.'
    )
    .setVersion('1.0.0')
    .addCookieAuth('gymguide_access_token')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(APP_CONFIG.PORT, '0.0.0.0');
  console.log(
    `🚀 GymGuide NestJS API running on http://localhost:${APP_CONFIG.PORT}/${APP_CONFIG.API_PREFIX}`
  );
  console.log(
    `📘 Swagger OpenAPI Docs available at http://localhost:${APP_CONFIG.PORT}/api/docs`
  );
  return app;
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('❌ Failed to start GymGuide backend:', err);
    process.exit(1);
  });
}

module.exports = {
  bootstrap,
};
