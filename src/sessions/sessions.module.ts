import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { SessionsController } from './sessions.controller';
import { SitesModule } from '../sites/sites.module';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { SessionsService } from './sessions.service';
import { FeaturesModule } from '../features/features.module';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService],
  imports: [UsersModule, FeaturesModule, SitesModule, DashboardDbModule],
})
export class SessionsModule {}
