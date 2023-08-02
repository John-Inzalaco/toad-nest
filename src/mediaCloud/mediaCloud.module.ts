import { Module } from '@nestjs/common';
import { MediaCloudService } from './mediaCloud.service';

@Module({
  providers: [MediaCloudService],
  exports: [MediaCloudService],
})
export class MediaCloudModule {}
