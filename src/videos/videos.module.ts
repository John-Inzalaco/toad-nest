import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { DashboardDbModule } from '../db/dashboardDb.module';
import { CDNModule } from '../cdn/cdn.module';
import { MediaCloudModule } from '../mediaCloud/mediaCloud.module';

@Module({
  controllers: [VideosController],
  providers: [VideosService],
  imports: [DashboardDbModule, CDNModule, MediaCloudModule],
})
export class VideosModule {}
