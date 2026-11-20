// ============================================================================
// GYMGUIDE - HEALTH MODULE & CONTROLLER (GET /api/v1/health)
// ============================================================================

const { Controller, Get, Dependencies, Module } = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const { PrismaService } = require('../../database/prisma.service');

@ApiTags('Health')
@Controller('health')
@Dependencies(PrismaService)
class HealthController {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  @Get()
  @ApiOperation({ summary: 'Check API health, uptime, and database status' })
  async checkHealth() {
    const exercises = await this.prisma.getAllExercisesFormatted();
    const muscles = await this.prisma.getAllMusclesFormatted();
    const plans = await this.prisma.getAllWorkoutPlansFormatted();

    return {
      status: 'ok',
      service: 'gymguide-api',
      version: '1.0.0',
      database: {
        connected: true,
        engine: this.prisma.mode,
        counts: {
          exercises: exercises.length,
          muscles: muscles.length,
          workoutPlans: plans.length,
        },
      },
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

@Module({
  controllers: [HealthController],
})
class HealthModule {}

module.exports = {
  HealthController,
  HealthModule,
};
