import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MCPHasAccess } from '../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';
import { PlaylistsService } from './playlists.service';
import {
  ListPlaylistsQueryParams,
  ListPlaylistsResponseDto,
} from './dto/ListPlaylists.dto';

@ApiBearerAuth()
@ApiTags('Playlists')
@Controller('api/v1/sites/:siteId/playlists')
export class PlaylistsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly playlistsService: PlaylistsService,
  ) {}
  /**
   * List of Playlists
   */
  @Get()
  @MCPHasAccess()
  async findAll(
    @Param('siteId') siteId: number,
    @Query() params: ListPlaylistsQueryParams,
  ): Promise<ListPlaylistsResponseDto> {
    await this.permissionsService.assertCanAccessVideos(siteId);
    return this.playlistsService.findAll(siteId, params);
  }

  /**
   * WIP: Placeholder for auth logic
   */
  @Post()
  @MCPHasAccess()
  create() {
    return null;
  }

  /**
   * WIP: Placeholder for auth logic
   */
  @Patch(':id')
  @MCPHasAccess()
  update() {
    return null;
  }

  /**
   * WIP: Placeholder for auth logic
   */
  @Delete(':id')
  @MCPHasAccess()
  remove() {
    return null;
  }
}
