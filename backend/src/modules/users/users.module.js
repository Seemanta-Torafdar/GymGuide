// ============================================================================
// GYMGUIDE - USERS MODULE (Favorites & Workout Logs)
// ============================================================================

const {
  Injectable,
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Bind,
  Dependencies,
  Module,
} = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const { PrismaService } = require('../../database/prisma.service');
const { JwtAuthGuard } = require('../../guards/jwt-auth.guard');
const { DtoValidationPipe } = require('../../common/dto-validator.pipe');

const WORKOUT_LOG_SCHEMA = {
  exerciseId: { type: 'string', required: true, maxLength: 80 },
  setsDone: { type: 'number', required: true, min: 1, max: 30 },
  repsDone: { type: 'number', required: true, min: 1, max: 200 },
  weightKg: { type: 'number', required: false, min: 0, max: 600 },
  notes: { type: 'string', required: false, maxLength: 240 },
};

@Injectable()
@Dependencies(PrismaService)
class UsersService {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  async getUserLogs(userId) {
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.workoutLog.findMany({
        where: { userId },
        include: { exercise: true },
        orderBy: { performedAt: 'desc' },
        take: 25,
      });
    }
    return this.prisma.memoryStore.workoutLogs.filter((l) => l.userId === userId);
  }

  async createWorkoutLog(userId, dto) {
    const clean = new DtoValidationPipe(WORKOUT_LOG_SCHEMA).transform(dto);
    if (this.prisma.isPostgresConnected && this.prisma.client) {
      return this.prisma.client.workoutLog.create({
        data: {
          userId,
          exerciseId: clean.exerciseId,
          setsDone: clean.setsDone,
          repsDone: clean.repsDone,
          weightKg: clean.weightKg || null,
          notes: clean.notes || null,
        },
      });
    }
    const entry = {
      id: `log-${Date.now()}`,
      userId,
      ...clean,
      performedAt: new Date().toISOString(),
    };
    this.prisma.memoryStore.workoutLogs.unshift(entry);
    return entry;
  }
}

@ApiTags('Users')
@Controller('users')
@Dependencies(UsersService)
class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  @Get('workout-logs')
  @UseGuards(JwtAuthGuard)
  @Bind(Req())
  @ApiOperation({ summary: 'Get authenticated user workout history logs' })
  async getLogs(req) {
    return this.usersService.getUserLogs(req.user.id);
  }

  @Post('workout-logs')
  @UseGuards(JwtAuthGuard)
  @Bind(Req(), Body())
  @ApiOperation({ summary: 'Log a completed exercise set for the authenticated user' })
  async addLog(req, body) {
    return this.usersService.createWorkoutLog(req.user.id, body);
  }
}

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
class UsersModule {}

module.exports = {
  UsersService,
  UsersController,
  UsersModule,
};
