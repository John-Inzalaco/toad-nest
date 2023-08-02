import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { sites, users, videos, video_callbacks } from '@prisma/dashboard';
import {
  FileJson,
  ImageJson,
  ReqCreateVideoDto,
} from './dto/ReqCreateVideo.dto';
import { MediaCloudService } from '../mediaCloud/mediaCloud.service';
import { CDNService } from '../cdn/cdn.service';
import { ResCreateVideoDto } from './dto/ResCreateVideo.dto';
import { SiteVideoSettingsHStoreRaw } from '../sites/hstore/SiteVideoSettingsHStore';
import {
  GetVideosQueryDto,
  GetVideosParamsDto,
  GetVideosResponseDto,
} from './dto/GetVideos.dto';
import {
  VideoUpNextOrder,
  videoUpNextOrderKeys,
} from './enum/VideoUpNextOrder.enum';
import { VideoStatus } from './enum/VideoStatus.enum';
import { refineStringToLiteralUnion } from '../utils/refineStringToLiteralUnion';

type AllVideosParams = GetVideosQueryDto & GetVideosParamsDto;

@Injectable()
export class VideosService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
    private readonly cdnService: CDNService,
    private readonly mediaCloudService: MediaCloudService,
  ) {}

  getSiteById(id: string | number) {
    return this.dashboardDb.sites.findFirstOrThrow({
      where: { id: Number(id) },
    });
  }

  async getVideoDtoBySlug(
    slug: string,
    siteId: number,
  ): Promise<ResCreateVideoDto> {
    const video = await this.dashboardDb.videos.findFirstOrThrow({
      where: { slug, site_id: Number(siteId) },
      include: {
        video_chapters: true,
        video_tracks: true,
      },
    });

    if (!video.site_id) {
      throw new Error(`Video ${video.id} has no site_id`);
    }

    const site = await this.getSite(video.site_id);

    const hasUniquePermalink = await this.hasUniquePermalink(video);

    return new ResCreateVideoDto(
      video,
      hasUniquePermalink,
      site.video_settings,
    );
  }

  async create(videoCreateDto: ReqCreateVideoDto, siteId: number, user: users) {
    const site = await this.getSite(siteId);
    videoCreateDto.permalink =
      videoCreateDto.permalink || `http://${site.domain}`;
    validatePermalink(videoCreateDto.permalink, site.domain);

    const { file_json, image_json } = videoCreateDto;

    const videoTracks = (videoCreateDto.video_tracks_attributes || []).map(
      resolveWithTimestamps,
    );

    const videoChapters = (videoCreateDto.video_chapters_attributes || []).map(
      resolveWithTimestamps,
    );

    const slug = videoCreateDto.file_json.public_id;

    const hasCallback = await this.getCallbackOrNull(slug);
    const status = hasCallback ? VideoStatus.live : VideoStatus.processing;

    if (hasCallback) {
      await this.mediaCloudService.removeTag(slug);
    }

    const video = await this.dashboardDb.videos.create({
      data: {
        description: videoCreateDto.description,
        duration: videoCreateDto.file_json.duration,
        file: getFilePath(file_json),
        height: videoCreateDto.file_json.height,
        image: videoCreateDto.image || getFilePath(image_json),
        keywords: videoCreateDto.keywords,
        permalink: videoCreateDto.permalink,
        site_id: site.id,
        slug: videoCreateDto.file_json.public_id,
        status,
        title: videoCreateDto.title,
        user_id: user.id,
        video_headline: videoCreateDto.video_headline,
        video_number: await this.getVideoNumber(site),
        up_next_order: videoCreateDto.up_next_order,
        video_tracks: {
          createMany: {
            data: videoTracks,
          },
        },
        video_chapters: {
          createMany: {
            data: videoChapters,
          },
        },
        width: videoCreateDto.file_json.width,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        video_chapters: true,
        video_tracks: true,
      },
    });

    await this.cdnService.softPurgeKey({
      key: `video_sitemap/${siteId}`,
    });

    const hasUniquePermalink = await this.hasUniquePermalink(video);
    const videoDto = new ResCreateVideoDto(
      video,
      hasUniquePermalink,
      site.video_settings,
    );

    return videoDto;
  }

  ROWS_PER_PAGE = 9;
  ASPECT_RATIOS = [
    { min: 0, max: 0.65, ratio: '9:16' },
    { min: 0.65, max: 0.8, ratio: '3:4' },
    { min: 0.8, max: 1.2, ratio: '1:1' },
    { min: 1.2, max: 1.6, ratio: '4:3' },
  ];
  SEARCH_DICTIONARY = 'english';

  async search(params: AllVideosParams): Promise<GetVideosResponseDto> {
    const videos = await this.buildQuery(params);
    const total_count: number = await this.buildCountQuery(params);
    const videoIds = videos.map((video: { id: number }) => video.id);
    const videoIdToChapters = await this.fetchChapters(videoIds);
    const videoIdToTracks = await this.fetchTracks(videoIds);
    const videosWithChaptersAndTracks = videos.map((video) => {
      return {
        ...video,
        aspect_ratio: this.calculateAspectRatio(video.width, video.height),
        up_next_order:
          typeof video.up_next_order === 'number'
            ? VideoUpNextOrder[video.up_next_order]
            : null,
        status: video.status ? VideoStatus[video.status] : null,
        video_chapers: {
          chapters: videoIdToChapters[video.id] || [],
        },
        vtt: {
          tracks: videoIdToTracks[video.id] || [],
        },
      };
    });
    return {
      videos: videosWithChaptersAndTracks,
      total_count: total_count,
    };
  }

  async reprocess(slug: string) {
    const video = await this.dashboardDb.videos.update({
      where: {
        slug,
      },
      data: {
        status: VideoStatus.processing,
      },
      include: {
        video_tracks: true,
        video_chapters: true,
      },
    });

    if (!video || !video.site_id) {
      throw new NotFoundException('Video not found');
    }

    const site = await this.getSite(video.site_id);
    await this.mediaCloudService.explicitTransform(slug);

    return new ResCreateVideoDto(video, false, site.video_settings);
  }

  async callback() {
    /** No permissions policy */
    /** Validate cloudinary headers */
    /** Parse payload */
    /** if eager notification type, ignore */
    /** query video by slug */
    /** If no video, create a callback record */
    /** if video.deleted? do nothing */
    /** mark video as live */
    /** Remove temp tag from Cloudinary */
    /** render a string return  */
  }

  private async fetchTracks(videoIds: number[]) {
    const tracks = await this.dashboardDb.video_tracks.findMany({
      select: {
        id: true,
        video_id: true,
        filetype: true,
        kind: true,
        srclang: true,
        slug: true,
        label: true,
        default: true,
        created_at: true,
        updated_at: true,
      },
      where: {
        video_id: { in: videoIds },
      },
    });
    return tracks.reduce<Record<number, typeof tracks>>((acc, track) => {
      const videoId = track.video_id;
      if (!videoId) {
        return acc;
      }
      if (!acc[videoId]) {
        acc[videoId] = [];
      }
      acc[videoId].push(track);
      return acc;
    }, {});
  }

  private async fetchChapters(videoIds: number[]) {
    const chapters = await this.dashboardDb.video_chapters.findMany({
      select: {
        id: true,
        video_id: true,
        time: true,
        description: true,
        created_at: true,
        updated_at: true,
      },
      where: {
        video_id: { in: videoIds },
      },
      orderBy: {
        time: 'asc',
      },
    });
    return chapters.reduce<Record<number, typeof chapters>>((acc, chapter) => {
      const videoId = chapter.video_id;
      if (!videoId) {
        return acc;
      }
      if (!acc[videoId]) {
        acc[videoId] = [];
      }
      acc[videoId].push(chapter);
      return acc;
    }, {});
  }

  private async buildCountQuery(params: AllVideosParams): Promise<number> {
    const results = await this.dashboardDb.videos.count(
      this.buildFilters(params),
    );
    return results;
  }

  calculateAspectRatio(
    width: number | null | undefined,
    height: number | null | undefined,
  ): string {
    if (width && height) {
      for (const r in this.ASPECT_RATIOS) {
        const ratio = width / height;
        if (
          ratio >= this.ASPECT_RATIOS[r].min &&
          this.ASPECT_RATIOS[r].max >= ratio
        ) {
          return this.ASPECT_RATIOS[r].ratio;
        }
      }
    }
    return '16:9';
  }

  private buildFilters(params: AllVideosParams) {
    let priorities = {};
    if (params.priority) {
      priorities = this.buildPriority(params.priority);
    }

    let queries = {};
    if (typeof params.query === 'string') {
      queries = this.buildFullTextSearch(params.query);
    }

    return {
      where: {
        site_id: params.siteId,
        ...queries,
        ...priorities,
      },
    };
  }

  private async buildQuery(params: AllVideosParams) {
    const filters = this.buildFilters(params);

    let sorts = {};
    if (params.sort) {
      sorts = this.buildSort(params.sort, params.sort_order);
    }

    const pages = this.buildPagination(params.page, params.per_page);

    const results = await this.dashboardDb.videos.findMany({
      select: {
        id: true,
        created_at: true,
        description: true,
        duration: true,
        file: true,
        height: true,
        image: true,
        keywords: true,
        permalink: true,
        site_id: true,
        slug: true,
        status: true,
        title: true,
        up_next_order: true,
        updated_at: true,
        user_id: true,
        video_number: true,
        width: true,
      },
      ...filters,
      ...sorts,
      ...pages,
    });
    return results;
  }

  buildFullTextSearch(searchString: string | null) {
    if (searchString) {
      return {
        OR: [
          { title: { search: searchString } },
          { description: { search: searchString } },
          { keywords: { search: searchString } },
        ],
      };
    }
    return {};
  }

  private buildSort(
    sortBy: AllVideosParams['sort'],
    sortDir: AllVideosParams['sort_order'],
  ) {
    if (sortBy) {
      return {
        orderBy: [
          {
            [sortBy]: sortDir,
          },
        ],
      };
    }
    return {};
  }

  private buildPagination(page: number = 1, per_page: number) {
    page = page > 1 ? page : 1;
    const offset = (page - 1) * per_page;

    return {
      skip: offset,
      take: per_page,
    };
  }

  buildPriority(priorityValue: string | null) {
    if (!priorityValue) {
      return {};
    }
    const refinedPriorityValue = refineStringToLiteralUnion(
      priorityValue,
      videoUpNextOrderKeys,
    );
    if (refinedPriorityValue) {
      return {
        up_next_order: VideoUpNextOrder[refinedPriorityValue],
      };
    } else if (priorityValue.match(/^\d+$/)) {
      return {
        up_next_order: Number(priorityValue),
      };
    }
    return {};
  }

  /**
   * For a site, find the video with the highest video number
   * return the video number + 1
   * @param site
   */
  private async getVideoNumber(site: Pick<sites, 'id'>): Promise<number> {
    const video = await this.dashboardDb.videos.findFirst({
      where: {
        site_id: site.id,
      },
      select: {
        video_number: true,
      },
      orderBy: {
        video_number: 'desc',
      },
    });

    return (video?.video_number || 0) + 1;
  }

  /**
   * Returns whether a video has a unique permalink.
   * This is used in the UI to flag to users that they
   * should make sure that a video has a unique permalink,
   * as including multiple videos with the same permalink
   * within a playlist is a Google schema violation.
   */
  private async hasUniquePermalink(video: videos): Promise<boolean> {
    const videos = await this.dashboardDb.videos.findFirst({
      where: { permalink: video.permalink, id: { not: video.id } },
    });

    return !videos;
  }

  private async getCallbackOrNull(
    slug: videos['slug'],
  ): Promise<video_callbacks | null> {
    return this.dashboardDb.video_callbacks.findFirst({
      where: { slug },
    });
  }

  private async getSite(id: number) {
    const resp: VideoCreateSiteResp[] = await this.dashboardDb.$queryRaw`
      SELECT 
        sites.id AS id,
        sites.domain AS domain,
        hstore_to_json(sites.video_settings) AS video_settings
      FROM sites
      WHERE sites.id = ${id} 
    `;

    const site = resp[0];

    return site;
  }
}

type VideoCreateSiteResp = Pick<sites, 'domain' | 'id'> & {
  video_settings: SiteVideoSettingsHStoreRaw;
};

const resolveWithTimestamps = <T extends object>(
  obj: T,
): T & {
  created_at: Date;
  updated_at: Date;
} => ({
  ...obj,
  created_at: new Date(),
  updated_at: new Date(),
});

const getFilePath = ({ version, public_id }: ImageJson | FileJson) =>
  `v${version}/${public_id}`;

function validatePermalink(permalink: string, domain: string | null) {
  if (domain && !permalink.includes(domain)) {
    throw new BadRequestException(
      `Permalink must contain the domain name (${domain})`,
    );
  }
}
