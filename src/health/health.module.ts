import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { ReportingDbModule } from '../db/reportingDb.module';
import { PrismaHealthIndicator } from './prisma.health';

@Module({
  controllers: [HealthController],
  imports: [TerminusModule, DashboardDbModule, ReportingDbModule],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
