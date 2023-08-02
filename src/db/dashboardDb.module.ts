import { Module } from '@nestjs/common';
import {
  DashboardDbClientProvider,
  PrismaService,
} from './dashboardDb.service';

@Module({
  providers: [DashboardDbClientProvider, PrismaService],
  exports: [DashboardDbClientProvider],
})
export class DashboardDbModule {}
