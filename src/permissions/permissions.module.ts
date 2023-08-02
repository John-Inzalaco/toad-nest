import { Global, Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Global()
@Module({
  controllers: [],
  providers: [PermissionsService],
  imports: [DashboardDbModule],
  exports: [PermissionsService],
})
export class PermissionsModule {}
