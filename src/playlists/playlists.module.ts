import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { MediaCloudModule } from '../mediaCloud/mediaCloud.module';
import { PlaylistsService } from './playlists.service';
import { DashboardDbModule } from '../db/dashboardDb.module';

@Module({
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  imports: [DashboardDbModule, MediaCloudModule],
})
export class PlaylistsModule {}
