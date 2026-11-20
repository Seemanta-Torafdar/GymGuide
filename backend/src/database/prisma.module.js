// ============================================================================
// GYMGUIDE - GLOBAL PRISMA DATABASE MODULE
// ============================================================================

const { Global, Module } = require('@nestjs/common');
const { PrismaService } = require('./prisma.service');

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
class PrismaModule {}

module.exports = {
  PrismaModule,
};
