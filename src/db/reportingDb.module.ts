import { Module } from '@nestjs/common';
import { ReportingDbService } from './reportingDb.service';

@Module({
  providers: [ReportingDbService],
  exports: [ReportingDbService],
})
export class ReportingDbModule {}
