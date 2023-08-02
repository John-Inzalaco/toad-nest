import { Module } from '@nestjs/common';
import { VideoCallbacksController } from './video-callbacks.controller';
import { VideoCallbacksService } from './video-callbacks.service';
import { MediaCloudModule } from '../mediaCloud/mediaCloud.module';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  controllers: [VideoCallbacksController],
  providers: [VideoCallbacksService],
  imports: [MediaCloudModule, DashboardDbModule],
})
export class VideoCallbacksModule {}
