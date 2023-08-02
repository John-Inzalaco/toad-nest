import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { MCPHasAccess } from '../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { ReqCreateVideoDto } from './dto/ReqCreateVideo.dto';
import { PermissionsService } from '../permissions/permissions.service';
import { Request } from 'express';
import { TrimPipe } from '../utils/trim.pipe';
import {
  ResCreateVideoDto,
  ResCreateVideoWrapperDto,
} from './dto/ResCreateVideo.dto';
import { ReqGetVideoDto } from './dto/ReqGetVideo.dto';
import {
  GetVideosParamsDto,
  GetVideosQueryDto,
  GetVideosResponseDto,
} from './dto/GetVideos.dto';

@ApiBearerAuth()
@ApiTags('Videos')
@Controller('api/v1/sites/:siteId/videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly permissionsService: PermissionsService,
  ) {}
  /**
   * WIP: Placeholder for auth logic
   */
  @Get()
  @MCPHasAccess()
  async findAll(
    @Param() params: GetVideosParamsDto,
    @Query() queryParams: GetVideosQueryDto,
  ): Promise<GetVideosResponseDto> {
    await this.permissionsService.assertCanAccessVideos(params.siteId);
    const videos = await this.videosService.search({
      ...params,
      ...queryParams,
    });
    return videos;
  }

  @Get('/:slug')
  @MCPHasAccess()
  async show(
    @Param() { slug, siteId }: ReqGetVideoDto,
  ): Promise<{ video: ResCreateVideoDto }> {
    this.permissionsService.assertNoPermissionPolicy();
    const video = await this.videosService
      .getVideoDtoBySlug(slug, siteId)
      .catch(() => {
        throw new NotFoundException();
      });

    return { video: video };
  }

  /**
   * Create a new video record
   */
  @Post()
  @MCPHasAccess()
  async create(
    @Param('siteId') siteId: number,
    @Body(TrimPipe) videoPayload: ReqCreateVideoDto,
    @Req() request: Request,
  ): Promise<ResCreateVideoWrapperDto> {
    await this.permissionsService.assertCanAccessVideos(siteId);
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    const video = await this.videosService.create(videoPayload, siteId, user);

    return { video };
  }

  /**
   * Sends a request to reprocess Video transforms from Cloudinary. Marks
   * video status as processing. Cloudinary will call our webhook when finished
   * to denote the video as being live.
   * @param slug
   */
  @Patch(`/:slug/reprocess`)
  async reprocess(
    @Param('siteId') siteId: number,
    @Param('slug') slug: string,
  ): Promise<ResCreateVideoWrapperDto> {
    await this.permissionsService.assertIsAdmin();
    const video = await this.videosService.reprocess(slug);
    return { video };
  }
}
