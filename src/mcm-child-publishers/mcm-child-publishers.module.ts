import { Module } from '@nestjs/common';
import { McmChildPublishersController } from './mcm-child-publishers.controller';
import { McmChildPublishersService } from './mcm-child-publishers.service';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  controllers: [McmChildPublishersController],
  providers: [McmChildPublishersService],
  imports: [DashboardDbModule],
})
export class McmChildPublishersModule {}
