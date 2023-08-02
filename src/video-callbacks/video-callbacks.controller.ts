import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { PermissionsService } from '../permissions/permissions.service';
import { VideoCallbacksService } from './video-callbacks.service';
import { SkipAuth } from '../auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateVideoCbReqBodyDto } from './dto/CreateVideoCbReqBody.dto';
import { CreateVideoCbReqHeadersDto } from './dto/CreateVideoCbReqHeaders.dto';

@ApiTags('Video Callbacks')
@Controller('/videos/callback')
export class VideoCallbacksController {
  constructor(
    private readonly videoCallbacksService: VideoCallbacksService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post()
  @SkipAuth()
  @HttpCode(200)
  callback(
    @Body() payload: CreateVideoCbReqBodyDto,
    @Headers() headers: CreateVideoCbReqHeadersDto,
  ) {
    this.permissionsService.assertNoPermissionPolicy();
    return this.videoCallbacksService.createCallback({ payload, headers });
  }
}
