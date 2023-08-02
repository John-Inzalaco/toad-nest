import { Module } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  providers: [FeaturesService],
  imports: [DashboardDbModule],
  exports: [FeaturesService],
})
export class FeaturesModule {}
