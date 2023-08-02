import { Module } from '@nestjs/common';
import { RevenueShareService } from './revenue-share.service';
import { ReportingDbModule } from '../db/reportingDb.module';

@Module({
  providers: [RevenueShareService],
  imports: [ReportingDbModule],
  exports: [RevenueShareService],
})
export class RevenueShareModule {}
