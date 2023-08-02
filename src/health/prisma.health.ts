import { Injectable } from '@nestjs/common';
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { DashboardDbService } from '../db/dashboardDb.service';
import { ReportingDbService } from '../db/reportingDb.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor() {
    super();
  }

  async isHealthy(
    key: string,
    db: DashboardDbService | ReportingDbService,
  ): Promise<HealthIndicatorResult> {
    try {
      await db.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError(
        `${key} is not available`,
        this.getStatus(key, false),
      );
    }
  }
}
