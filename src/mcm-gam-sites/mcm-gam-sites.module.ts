import { Module } from '@nestjs/common';
import { McmGamSitesController } from './mcm-gam-sites.controller';
import { McmGamSitesService } from './mcm-gam-sites.service';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  controllers: [McmGamSitesController],
  providers: [McmGamSitesService],
  imports: [DashboardDbModule],
})
export class McmGamSitesModule {}
