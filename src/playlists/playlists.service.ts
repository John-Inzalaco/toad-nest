import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { MediaCloudService } from '../mediaCloud/mediaCloud.service';
import {
  ListPlaylistsQueryParams,
  ListPlaylistsResponseDto,
} from './dto/ListPlaylists.dto';
import { Prisma } from '@prisma/dashboard';
import { isPresent } from '../utils/isPresent';

@Injectable()
export class PlaylistsService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDbService: DashboardDbService,
    private readonly mediaCloudService: MediaCloudService,
  ) {}
  async findAll(
    siteId: number,
    params: ListPlaylistsQueryParams,
  ): Promise<ListPlaylistsResponseDto> {
    const where: Prisma.playlistsWhereInput = {
      site_id: siteId,
    };

    const orderBy: Prisma.playlistsOrderByWithRelationAndSearchRelevanceInput =
      {
        [params.sort]: params.direction,
      };

    if (params.query) {
      where.OR = [
        { title: { search: params.query } },
        { description: { search: params.query } },
      ];
    }

    const take = params.page ? params.per_page : undefined;
    const skip = params.page ? (params.page - 1) * params.per_page : undefined;

    const playlistsDb = await this.dashboardDbService.playlists.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        playlist_videos: {
          select: {
            videos: {
              select: {
                image: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    const totalCount = await this.dashboardDbService.playlists.count({
      where,
    });

    const playlists = playlistsDb.map((playlistWithJoin) => {
      const playlist = {
        ...playlistWithJoin,
        videos:
          playlistWithJoin.playlist_videos
            ?.map((playlistToVideo) => {
              return {
                ...playlistToVideo.videos,
                image: this.mediaCloudService.generateThumbnailPath(
                  playlistToVideo.videos,
                ),
              };
            })
            .filter(isPresent) || [],
        playlist_videos: undefined,
      };

      return playlist;
    });

    return {
      playlists: playlists,
      total_count: totalCount,
    };
  }
}
