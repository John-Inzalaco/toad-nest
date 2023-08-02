import { Module } from '@nestjs/common';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { RevenueShareModule } from '../revenue-share/revenue-share.module';
import { FeaturesModule } from '../features/features.module';
import { MediaCloudModule } from '../mediaCloud/mediaCloud.module';

@Module({
  controllers: [SitesController],
  providers: [SitesService],
  imports: [
    MediaCloudModule,
    DashboardDbModule,
    RevenueShareModule,
    FeaturesModule,
  ],
})
export class SitesModule {}
