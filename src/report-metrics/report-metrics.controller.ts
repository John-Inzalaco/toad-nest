import { Controller, Get } from '@nestjs/common';
import { PDSHasAccess } from '../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Report Metrics')
@Controller('api/v1/reports/metrics')
export class ReportMetricsController {
  /**
   * WIP: Placeholder for auth logic
   */
  @Get('summary')
  @PDSHasAccess()
  async summary() {
    return { summary: null };
  }
}
