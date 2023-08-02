import { Module } from '@nestjs/common';
import { PsasService } from './psas.service';
import { PsasController } from './psas.controller';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  controllers: [PsasController],
  providers: [PsasService],
  imports: [DashboardDbModule],
})
export class PsasModule {}
