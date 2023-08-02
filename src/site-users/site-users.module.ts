import { Module } from '@nestjs/common';
import { SiteUsersController } from './site-users.controller';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { SiteUsersService } from './site-users.service';
import { EmailsModule } from '../emails/emails.module';

@Module({
  controllers: [SiteUsersController],
  imports: [DashboardDbModule, EmailsModule],
  providers: [SiteUsersService],
})
export class SiteUsersModule {}
