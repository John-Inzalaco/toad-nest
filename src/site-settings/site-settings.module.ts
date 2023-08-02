import { Module } from '@nestjs/common';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { ReportingDbModule } from '../db/reportingDb.module';
import { SlackModule } from '../slack/slack.module';

@Module({
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService],
  imports: [DashboardDbModule, ReportingDbModule, SlackModule],
})
export class SiteSettingsModule {}
