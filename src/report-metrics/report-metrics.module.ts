import { Module } from '@nestjs/common';
import { ReportMetricsController } from './report-metrics.controller';

@Module({
  controllers: [ReportMetricsController],
})
export class ReportMetricsModule {}
