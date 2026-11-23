// ============================================================================
// GYMGUIDE - CLI RESUMABLE MEDIA MIGRATION TO MINIO OBJECT STORAGE
// Usage: npm --prefix backend run media:migrate [-- --overwrite]
// Safely inspects all 69 exercises + legacy uploads/ + custom-videos.json,
// uploads accessible files into MinIO, saves PostgreSQL metadata, and prints report.
// ============================================================================

const fs = require('fs');
const path = require('path');
const distAppPath = path.resolve(__dirname, '../dist/app.module.js');
const useDist = process.env.NODE_ENV === 'production' && fs.existsSync(distAppPath);
if (!useDist && fs.existsSync(path.resolve(__dirname, '../register.js'))) {
  require('../register');
}
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require(useDist ? '../dist/app.module' : '../src/app.module');
const { MediaService } = require(useDist
  ? '../dist/modules/media/media.service'
  : '../src/modules/media/media.service');

async function runCliMigration() {
  const overwriteExisting = process.argv.includes('--overwrite');
  console.log('🚀 Starting GymGuide Resumable Media Migration to MinIO...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const mediaService = app.get(MediaService);
    const report = await mediaService.migrateLegacyMedia({ overwriteExisting });

    console.log('\n📊 === GYMGUIDE MINIO MIGRATION REPORT ===');
    console.log(`Bucket:                    ${report.bucket}`);
    console.log(`Total Exercises Scanned:   ${report.totalExercises}`);
    console.log(`Existing Video References: ${report.existingVideos}`);
    console.log(`Existing Image Records:    ${report.existingImages}`);
    console.log(`Migrated Files:            ${report.migratedFiles.length}`);
    console.log(`Skipped (Already in S3):   ${report.skippedAlreadyMigrated.length}`);
    console.log(`External Refs Preserved:   ${report.externalPreservedReferences.length}`);
    console.log(`Missing Local Files:       ${report.missingMedia.length}`);
    console.log(`Duplicate File Hashes:     ${report.duplicateFiles.length}`);
    console.log(`Failed Migrations:         ${report.failedMigrations.length}`);

    if (report.migratedFiles.length > 0) {
      console.log('\n✅ Migrated Objects:');
      for (const item of report.migratedFiles) {
        console.log(`  - ${item.exerciseSlug}: ${item.from} -> ${item.toObjectKey} (${item.fileSize} bytes)`);
      }
    }
    if (report.externalPreservedReferences.length > 0) {
      console.log('\nℹ️ Preserved External Video References:');
      for (const item of report.externalPreservedReferences) {
        console.log(`  - ${item.exerciseSlug}: ${item.sourceUrl} (${item.reason})`);
      }
    }
    if (report.missingMedia.length > 0) {
      console.log('\n⚠️ Missing Local Files:');
      for (const item of report.missingMedia) {
        console.log(`  - ${item.exerciseSlug}: ${item.reference} (${item.reason})`);
      }
    }
    if (report.failedMigrations.length > 0) {
      console.log('\n❌ Failed Migrations:');
      for (const item of report.failedMigrations) {
        console.log(`  - ${item.exerciseSlug}: ${item.reference} (${item.error})`);
      }
    }
    console.log('\n📄 Report saved to backend/prisma/data/minio-migration-report.json');
  } finally {
    await app.close();
  }
}

runCliMigration().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
