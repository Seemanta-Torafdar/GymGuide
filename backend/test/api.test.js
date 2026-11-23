// ============================================================================
// GYMGUIDE - BACKEND API & SECURITY INTEGRATION TEST SUITE
// Verifies all REST endpoints, security headers, rate-limiting & DTO validation
// ============================================================================

require('../register');
const assert = require('assert');
const http = require('http');
const { NestFactory } = require('@nestjs/core');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const express = require('express');
const { AppModule } = require('../src/app.module');

function requestJson(port, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const json = raw ? JSON.parse(raw) : {};
            resolve({ status: res.statusCode, headers: res.headers, body: json });
          } catch (e) {
            resolve({ status: res.statusCode, headers: res.headers, body: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting GymGuide NestJS Backend & Security Integration Tests...');
  process.env.FORCE_SEED_STORE = 'true';

  const app = await NestFactory.create(AppModule, { logger: ['error'] });
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.use((req, _res, next) => {
    if (req.url === '/api/media' || req.url.startsWith('/api/media/') || req.url.startsWith('/api/media?')) {
      req.url = req.url.replace(/^\/api\/media/, '/api/v1/media');
    }
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(helmet());
  app.setGlobalPrefix('api/v1');

  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  const port = address.port;

  try {
    // 1. GET /api/v1/health + Security Headers
    const healthRes = await requestJson(port, 'GET', '/api/v1/health');
    assert.strictEqual(healthRes.status, 200, 'Health endpoint should return 200');
    assert.strictEqual(healthRes.body.success, true);
    assert.strictEqual(healthRes.body.data.status, 'ok');
    assert.ok(healthRes.body.data.database.counts.exercises >= 50, 'Should have >= 50 exercises');
    assert.ok(healthRes.headers['x-content-type-options'] === 'nosniff', 'Helmet header missing');
    assert.ok(healthRes.headers['x-ratelimit-limit'], 'Rate limit header missing');
    console.log('  ✔ GET /api/v1/health & security/rate-limit headers verified');

    // 2. GET /api/v1/muscles
    const musclesRes = await requestJson(port, 'GET', '/api/v1/muscles');
    assert.strictEqual(musclesRes.status, 200);
    assert.strictEqual(musclesRes.body.data.length, 15, 'Should return 15 anatomical muscles');
    console.log('  ✔ GET /api/v1/muscles verified (15 anatomical muscles)');

    // 3. GET /api/v1/muscles/chest/exercises
    const chestExRes = await requestJson(port, 'GET', '/api/v1/muscles/chest/exercises');
    assert.strictEqual(chestExRes.status, 200);
    assert.ok(chestExRes.body.data.primaryExercises.length >= 7, 'Should return >= 7 primary chest exercises');
    console.log('  ✔ GET /api/v1/muscles/chest/exercises verified');

    // 4. GET /api/v1/exercises & filtering
    const exRes = await requestJson(port, 'GET', '/api/v1/exercises?category=Chest');
    assert.strictEqual(exRes.status, 200);
    assert.ok(exRes.body.data.length >= 20, 'Should return >= 20 Chest exercises across all 5 equipment categories');
    assert.ok(exRes.body.meta.total >= 20);
    console.log('  ✔ GET /api/v1/exercises?category=Chest verified');

    // 5. GET /api/v1/exercises/:id
    const detailRes = await requestJson(port, 'GET', '/api/v1/exercises/barbell-bench-press');
    assert.strictEqual(detailRes.status, 200);
    assert.strictEqual(detailRes.body.data.name, 'Barbell Bench Press');
    assert.ok(detailRes.body.data.instructions.length >= 3);
    assert.ok(detailRes.body.data.similarExercises.length >= 2);
    console.log('  ✔ GET /api/v1/exercises/barbell-bench-press verified');

    // 6. GET /api/v1/exercises/compare
    const compareRes = await requestJson(
      port,
      'GET',
      '/api/v1/exercises/compare?first=barbell-bench-press&second=dumbbell-bench-press'
    );
    assert.strictEqual(compareRes.status, 200);
    assert.strictEqual(compareRes.body.data.first.slug, 'barbell-bench-press');
    assert.strictEqual(compareRes.body.data.second.slug, 'dumbbell-bench-press');
    console.log('  ✔ GET /api/v1/exercises/compare verified');

    // 7. GET /api/v1/equipment
    const eqRes = await requestJson(port, 'GET', '/api/v1/equipment');
    assert.strictEqual(eqRes.status, 200);
    assert.ok(eqRes.body.data.length >= 10);
    console.log('  ✔ GET /api/v1/equipment verified');

    // 8. GET /api/v1/workout-plans & :id
    const plansRes = await requestJson(port, 'GET', '/api/v1/workout-plans');
    assert.strictEqual(plansRes.status, 200);
    assert.strictEqual(plansRes.body.data.length, 6, 'Should have all 6 required workout plans');

    const singlePlanRes = await requestJson(port, 'GET', '/api/v1/workout-plans/full-body-workout');
    assert.strictEqual(singlePlanRes.status, 200);
    assert.strictEqual(singlePlanRes.body.data.days.length, 3);
    console.log('  ✔ GET /api/v1/workout-plans (6 plans) & detail verified');

    // 9. GET /api/v1/search?q=dumbbell
    const searchRes = await requestJson(port, 'GET', '/api/v1/search?q=dumbbell');
    assert.strictEqual(searchRes.status, 200);
    assert.ok(searchRes.body.data.exercises.length >= 10);
    console.log('  ✔ GET /api/v1/search?q=dumbbell verified');

    // 10. Security: Mass-assignment rejection on POST /api/v1/auth/register
    const massAssignRes = await requestJson(port, 'POST', '/api/v1/auth/register', {
      email: 'attacker@example.com',
      password: 'StrongPassword123!',
      displayName: 'Attacker',
      role: 'ADMIN', // Forbidden mass-assigned field
    });
    assert.strictEqual(massAssignRes.status, 400, 'Should reject mass-assigned role field with 400');
    console.log('  ✔ Anti-mass-assignment security protection verified');

    // 11. Auth flow with HttpOnly Cookies
    const regRes = await requestJson(port, 'POST', '/api/v1/auth/register', {
      email: 'tester@gymguide.local',
      password: 'SecurePassword2026!',
      displayName: 'Test Athlete',
    });
    assert.strictEqual(regRes.status, 201);
    const setCookies = regRes.headers['set-cookie'] || [];
    assert.ok(
      setCookies.some((c) => c.includes('gymguide_access_token') && c.includes('HttpOnly')),
      'Access token must be delivered in an HttpOnly cookie'
    );
    console.log('  ✔ Auth registration & HttpOnly cookie issuance verified');

    // 12. Admin Exercise Video assignment (PUT /api/v1/exercises/:id/video)
    const videoUpdateRes = await requestJson(
      port,
      'PUT',
      '/api/v1/exercises/cable-chest-fly/video',
      {
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-out-on-a-bench-press-40241-large.mp4',
        sideVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-lifting-dumbbells-at-the-gym-40244-large.mp4',
        videoNotes: 'Keep slight bend in elbows throughout horizontal adduction arc.',
      }
    );
    assert.strictEqual(videoUpdateRes.status, 200);
    assert.strictEqual(videoUpdateRes.body.data.hasCustomVideo, true);
    assert.ok(videoUpdateRes.body.data.videoUrl.includes('.mp4'));
    console.log('  ✔ PUT /api/v1/exercises/:id/video (Admin Video Manager) verified');

    // 13. MinIO storage health status & 69-exercise overview (via both /api/v1/media and /api/media)
    assert.strictEqual(healthRes.body.data.storage.engine, 'minio');
    const overviewRes = await requestJson(port, 'GET', '/api/v1/media/overview');
    assert.strictEqual(overviewRes.status, 200);
    assert.strictEqual(overviewRes.body.data.totalExercises, 69, 'Should report all 69 seeded exercises');
    console.log('  ✔ GET /api/v1/media/overview (69 exercises + MinIO health) verified');

    // 14. Authorization enforcement on protected MinIO endpoints (401 Unauthenticated & 403 Non-Admin)
    const unauthUploadRes = await requestJson(port, 'POST', '/api/v1/media/upload', {});
    assert.strictEqual(unauthUploadRes.status, 401, 'Unauthenticated upload must return 401');

    const unauthDeleteRes = await requestJson(port, 'DELETE', '/api/v1/media/fake-id');
    assert.strictEqual(unauthDeleteRes.status, 401, 'Unauthenticated delete must return 401');

    const userCookie = setCookies.map((c) => c.split(';')[0]).join('; ');
    const userUploadRes = await requestJson(port, 'POST', '/api/v1/media/upload', {}, { Cookie: userCookie });
    assert.strictEqual(userUploadRes.status, 403, 'Standard USER role upload must return 403 Forbidden');

    const userMigrateRes = await requestJson(port, 'POST', '/api/v1/media/migrate', {}, { Cookie: userCookie });
    assert.strictEqual(userMigrateRes.status, 403, 'Standard USER role migrate must return 403 Forbidden');
    console.log('  ✔ RBAC Authorization (401 unauthenticated / 403 USER) verified');

    // 15. MinioStorageService object-key normalization & path-traversal immunity
    const { MinioStorageService } = require('../src/modules/media/minio-storage.service');
    const { MediaService } = require('../src/modules/media/media.service');
    const storageSvc = app.get(MinioStorageService);
    const mediaSvc = app.get(MediaService);

    assert.strictEqual(
      storageSvc.buildExerciseObjectKey('Chest', 'barbell-bench-press', { mediaType: 'VIDEO', angle: 'front', ext: '.mp4' }),
      'exercises/chest/barbell-bench-press/video.mp4'
    );
    assert.strictEqual(
      storageSvc.buildExerciseObjectKey('Back', 'lat-pulldown', { mediaType: 'IMAGE', stepNumber: 1 }),
      'exercises/back/lat-pulldown/step-01-starting.webp'
    );
    assert.strictEqual(
      storageSvc.buildExerciseObjectKey('Legs', 'barbell-back-squat', { mediaType: 'IMAGE', stepNumber: 4 }),
      'exercises/legs/barbell-back-squat/step-04-return-muscle.webp'
    );
    assert.throws(
      () => storageSvc.buildExerciseObjectKey('Chest', 'barbell-bench-press', { mediaType: 'IMAGE', stepNumber: 5 }),
      /between 1 and 4/
    );
    console.log('  ✔ MinioStorageService object key hierarchy & step validation verified');

    // 16. Signed stream token verification & expiration defense
    const futureExp = Math.floor(Date.now() / 1000) + 300;
    const validSig = mediaSvc._signStreamToken('test-media-1', futureExp);
    assert.strictEqual(mediaSvc.verifyStreamToken('test-media-1', String(futureExp), validSig), true);
    assert.throws(
      () => mediaSvc.verifyStreamToken('test-media-1', String(Math.floor(Date.now() / 1000) - 10), validSig),
      /expired/i
    );
    assert.throws(
      () => mediaSvc.verifyStreamToken('test-media-1', String(futureExp), 'tampered-signature'),
      /Invalid/i
    );
    console.log('  ✔ HMAC signed stream token verification & expiry checks verified');

    // 17. Admin login & malicious/invalid multipart upload rejection (magic-byte defense)
    process.env.SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@gymguide.local';
    process.env.SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'GymGuideAdmin#2026';
    const { PrismaService } = require('../src/database/prisma.service');
    const prismaSvc = app.get(PrismaService);
    await prismaSvc._seedFallbackUsers();

    const adminLoginRes = await requestJson(port, 'POST', '/api/v1/auth/login', {
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    });
    assert.ok(
      adminLoginRes.status === 200 || adminLoginRes.status === 201,
      `Seeded admin login should succeed (got ${adminLoginRes.status})`
    );
    const adminCookie = (adminLoginRes.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');

    // Construct raw multipart payload with spoofed .mp4 text content
    const boundary = '----GymGuideTestBoundary123';
    const fakeMp4Body = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="exerciseSlug"\r\n\r\nbarbell-bench-press\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="mediaType"\r\n\r\nVIDEO\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="spoofed.mp4"\r\n` +
        `Content-Type: video/mp4\r\n\r\nNOT_A_REAL_MP4_EXECUTABLE\r\n` +
        `--${boundary}--\r\n`,
      'utf8'
    );
    const spoofedRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/api/media/upload',
          method: 'POST',
          headers: {
            Cookie: adminCookie,
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': fakeMp4Body.length,
          },
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(raw || '{}') }));
        }
      );
      req.on('error', reject);
      req.write(fakeMp4Body);
      req.end();
    });
    assert.strictEqual(spoofedRes.status, 400, 'Spoofed non-MP4 file must be rejected with 400');
    console.log('  ✔ Admin RBAC login & spoofed-file magic-byte validation verified');

    // 18. Sharp WebP image optimization check (aspect-ratio preserving)
    const sharp = require('sharp');
    const { validateAndOptimizeImage } = require('../src/modules/media/media-processing.util');
    const syntheticPng = await sharp({
      create: { width: 1600, height: 900, channels: 3, background: { r: 23, g: 63, b: 53 } },
    })
      .png()
      .toBuffer();
    const optimized = await validateAndOptimizeImage({
      originalname: 'step-01.png',
      mimetype: 'image/png',
      buffer: syntheticPng,
    });
    assert.strictEqual(optimized.mimeType, 'image/webp');
    assert.strictEqual(optimized.width, 1280);
    assert.strictEqual(optimized.height, 720);
    console.log('  ✔ Sharp WebP aspect-preserving optimization (1600x900 -> 1280x720 WebP) verified');

    // Clean up test video mutation on cable-chest-fly
    await requestJson(port, 'DELETE', '/api/v1/exercises/cable-chest-fly/video');

    // 19. Hybrid 4-Step Visual Sequence check across ALL 69 exercises
    const all69Res = await requestJson(port, 'GET', '/api/v1/exercises?limit=100');
    assert.strictEqual(all69Res.status, 200);
    assert.strictEqual(all69Res.body.data.length, 69, 'Expected all 69 exercises');
    for (const ex of all69Res.body.data) {
      assert.strictEqual(ex.instructions.length, 4, `${ex.slug} must have 4 instruction steps`);
      assert.strictEqual(ex.stepImages.length, 4, `${ex.slug} must have 4 stepImages entries`);
      for (let stepNum = 1; stepNum <= 4; stepNum += 1) {
        const st = ex.instructions[stepNum - 1];
        assert.strictEqual(st.stepNumber, stepNum);
        assert.ok(st.title && st.title.length >= 3, `${ex.slug} step ${stepNum} needs title`);
        assert.ok(st.instruction && st.instruction.length >= 15, `${ex.slug} step ${stepNum} needs description`);
        assert.ok(st.coachingCue && st.coachingCue.length >= 5, `${ex.slug} step ${stepNum} needs cue`);
        assert.ok(st.imageUrl, `${ex.slug} step ${stepNum} needs imageUrl`);
      }
    }
    console.log('  ✔ Hybrid 4-step structure (titles, descriptions, cues, imageUrls) verified across all 69 exercises');

    console.log('🎉 All 19 GymGuide Backend, Hybrid 4-Step, MinIO Security & API Integration Tests PASSED!');
  } finally {
    await app.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});
