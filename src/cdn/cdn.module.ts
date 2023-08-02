import { Module } from '@nestjs/common';
import { CDNService } from './cdn.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [CDNService],
  imports: [ConfigModule],
  exports: [CDNService],
})
export class CDNModule {}
