import { VideosService } from '../src/videos/videos.service';
import { CDNService } from '../src/cdn/cdn.service';
import { MediaCloudService } from '../src/mediaCloud/mediaCloud.service';
import { ConfigService } from '@nestjs/config';
import { VideoStatus } from '../src/videos/enum/VideoStatus.enum';
import { EnvironmentVariables } from '../src/environment';
import { PrismaClient } from '@prisma/dashboard';

describe('Videos Service', () => {
  let videosService: VideosService;
  const dashboardDb = new PrismaClient();
  let cdnService: CDNService;
  let configService: ConfigService<EnvironmentVariables>;
  let mediaCloudService: MediaCloudService;
  let defaultAspectRatio: string;

  beforeEach(() => {
    configService = new ConfigService<EnvironmentVariables>();
    cdnService = new CDNService(configService);
    mediaCloudService = new MediaCloudService(configService);

    videosService = new VideosService(
      dashboardDb,
      cdnService,
      mediaCloudService,
    );

    defaultAspectRatio = '16:9';
  });

  describe('VideoStatus enum', () => {
    it('has expected values', () => {
      expect(VideoStatus.processing).toEqual(0);
      expect(VideoStatus.live).toEqual(1);
      expect(VideoStatus.deleted).toEqual(2);
    });
  });

  describe('calculateAspectRatios', () => {
    it('returns default value whenever width param is falsy', () => {
      expect(videosService.calculateAspectRatio(undefined, 100)).toEqual(
        defaultAspectRatio,
      );
      expect(videosService.calculateAspectRatio(null, 100)).toEqual(
        defaultAspectRatio,
      );
      expect(videosService.calculateAspectRatio(0, 100)).toEqual(
        defaultAspectRatio,
      );
    });
    it('returns default value whenever height param is falsy', () => {
      expect(videosService.calculateAspectRatio(100, undefined)).toEqual(
        defaultAspectRatio,
      );
      expect(videosService.calculateAspectRatio(100, null)).toEqual(
        defaultAspectRatio,
      );
      expect(videosService.calculateAspectRatio(100, 0)).toEqual(
        defaultAspectRatio,
      );
    });

    it('returns default value whenever ratio is out of calculated ratio max (edge)', () => {
      expect(videosService.calculateAspectRatio(160, 99)).toEqual(
        defaultAspectRatio,
      );
    });

    it('returns 9:16 whenever ratio is between 0 and 0.65', () => {
      expect(videosService.calculateAspectRatio(1, 100)).toEqual('9:16');
      expect(videosService.calculateAspectRatio(1, 65)).toEqual('9:16');
    });

    it('returns 3:4 whenever ratio is between 0.66 and 0.8', () => {
      expect(videosService.calculateAspectRatio(66, 100)).toEqual('3:4');
      expect(videosService.calculateAspectRatio(80, 100)).toEqual('3:4');
    });

    it('returns 1:1 whenever ratio is between 0.8 and 1.2', () => {
      expect(videosService.calculateAspectRatio(81, 100)).toEqual('1:1');
      expect(videosService.calculateAspectRatio(119, 100)).toEqual('1:1');
    });

    it('returns 4:3 whenever ratio is between 1.2 and 1.6', () => {
      expect(videosService.calculateAspectRatio(121, 100)).toEqual('4:3');
      expect(videosService.calculateAspectRatio(159, 100)).toEqual('4:3');
    });
  });

  describe('buildPriority', () => {
    it('returns an object with an integer value when passed a valid enum string', () => {
      expect(videosService.buildPriority('standard')).toEqual({
        up_next_order: 0,
      });
      expect(videosService.buildPriority('boosted')).toEqual({
        up_next_order: 1,
      });
      expect(videosService.buildPriority('excluded')).toEqual({
        up_next_order: 2,
      });
    });

    it('returns an empty object when passed an invalid enum string', () => {
      expect(videosService.buildPriority('foobar')).toEqual({});
    });

    it('returns an object with an integer string value when passed a valid enum value', () => {
      expect(videosService.buildPriority('0')).toEqual({
        up_next_order: 0,
      });
      expect(videosService.buildPriority('1')).toEqual({
        up_next_order: 1,
      });
      expect(videosService.buildPriority('2')).toEqual({
        up_next_order: 2,
      });
    });

    it('returns an object with an invalid integer string value when passed an invalid enum value', () => {
      expect(videosService.buildPriority('99')).toEqual({
        up_next_order: 99,
      });
    });

    it('returns an empty object when passed an empty value', () => {
      expect(videosService.buildPriority('')).toEqual({});
      expect(videosService.buildPriority(null)).toEqual({});
      expect(videosService.buildPriority(' ')).toEqual({});
    });
  });

  describe('buildFullTextSearch', () => {
    it('returns an object searching desired fields for desired string', () => {
      expect(videosService.buildFullTextSearch('foobar')).toEqual({
        OR: [
          {
            title: { search: 'foobar' },
          },
          {
            description: { search: 'foobar' },
          },
          {
            keywords: { search: 'foobar' },
          },
        ],
      });
    });

    it('returns an empty object when passed an empty string', () => {
      expect(videosService.buildFullTextSearch('')).toEqual({});
    });
  });
});
