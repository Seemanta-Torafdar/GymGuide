// ============================================================================
// GYMGUIDE - EQUIPMENT MODULE (GET /api/v1/equipment)
// ============================================================================

const {
  Injectable,
  Controller,
  Get,
  Dependencies,
  Module,
} = require('@nestjs/common');
const { ApiTags, ApiOperation } = require('@nestjs/swagger');
const { PrismaService } = require('../../database/prisma.service');

@Injectable()
@Dependencies(PrismaService)
class EquipmentService {
  constructor(prismaService) {
    this.prisma = prismaService;
  }

  async findAll() {
    const equipmentList = await this.prisma.getAllEquipmentFormatted();
    const exercises = await this.prisma.getAllExercisesFormatted();

    return equipmentList.map((eq) => {
      const count = exercises.filter((ex) =>
        (ex.equipment || []).some((e) => e.slug === eq.slug || e.id === eq.id)
      ).length;
      return {
        ...eq,
        exerciseCount: count,
      };
    });
  }
}

@ApiTags('Equipment')
@Controller('equipment')
@Dependencies(EquipmentService)
class EquipmentController {
  constructor(equipmentService) {
    this.equipmentService = equipmentService;
  }

  @Get()
  @ApiOperation({ summary: 'List all gym equipment categories with exercise counts' })
  async findAll() {
    return this.equipmentService.findAll();
  }
}

@Module({
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
class EquipmentModule {}

module.exports = {
  EquipmentService,
  EquipmentController,
  EquipmentModule,
};
