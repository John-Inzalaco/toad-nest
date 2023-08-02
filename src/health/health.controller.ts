import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, HealthCheck } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { ReportingDbService } from '../db/reportingDb.service';
import { SkipAuth } from '../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealthIndicator: PrismaHealthIndicator,
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
    private reportingDb: ReportingDbService,
    private permissionsService: PermissionsService,
  ) {}

  @Get()
  @SkipAuth()
  @HealthCheck()
  async healthCheck() {
    this.permissionsService.assertNoPermissionPolicy();
    return this.health.check([
      () =>
        this.prismaHealthIndicator.isHealthy('dashboardDb', this.dashboardDb),
      () =>
        this.prismaHealthIndicator.isHealthy('reportingDb', this.reportingDb),
    ]);
  }
}
