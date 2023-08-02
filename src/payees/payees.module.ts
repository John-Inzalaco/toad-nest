import { Module } from '@nestjs/common';
import { PayeesService } from './payees.service';
import { PayeesController } from './payees.controller';
import { ConfigModule } from '@nestjs/config';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  providers: [PayeesService],
  imports: [ConfigModule, DashboardDbModule],
  controllers: [PayeesController],
})
export class PayeesModule {}
