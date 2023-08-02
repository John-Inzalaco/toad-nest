import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { CountriesController } from './countries.controller';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService],
  imports: [DashboardDbModule],
})
export class CountriesModule {}
