// ============================================================================
// GYMGUIDE - ROOT NESTJS APPLICATION MODULE (JavaScript ES6+)
// ============================================================================

const { Module } = require('@nestjs/common');
const { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } = require('@nestjs/core');
const { PrismaModule } = require('./database/prisma.module');
const { HealthModule } = require('./modules/health/health.module');
const { MuscleGroupsModule } = require('./modules/muscles/muscles.module');
const { ExercisesModule } = require('./modules/exercises/exercises.module');
const { EquipmentModule } = require('./modules/equipment/equipment.module');
const { WorkoutPlansModule } = require('./modules/workout-plans/workout-plans.module');
const { SearchModule } = require('./modules/search/search.module');
const { AuthModule } = require('./modules/auth/auth.module');
const { UsersModule } = require('./modules/users/users.module');
const { MediaModule } = require('./modules/media/media.module');
const { RateLimitGuard } = require('./guards/rate-limit.guard');
const { AllExceptionsFilter } = require('./filters/all-exceptions.filter');
const { ResponseTransformInterceptor } = require('./interceptors/response-transform.interceptor');

@Module({
  imports: [
    PrismaModule,
    MediaModule,
    HealthModule,
    MuscleGroupsModule,
    ExercisesModule,
    EquipmentModule,
    WorkoutPlansModule,
    SearchModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
class AppModule {}

module.exports = {
  AppModule,
};
