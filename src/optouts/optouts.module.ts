import { Module } from '@nestjs/common';
import { OptoutsService } from './optouts.service';
import { OptoutsController } from './optouts.controller';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  controllers: [OptoutsController],
  providers: [OptoutsService],
  imports: [DashboardDbModule],
})
export class OptoutsModule {}
