import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [DashboardDbModule],
  exports: [UsersService],
})
export class UsersModule {}
