import {
  createTestContext,
  seedUser,
  generateAuthToken,
  seedSite,
  seedVideo,
  seedVideoChapter,
  seedVideoTrack,
  normalizeDateTimeToUtc,
  seedVideoCallback,
  replaceRandomIds,
  captureOutboundRequest,
  testSiteUserRoleAccess as testSiteUserRoleAccessV2,
} from './__helpers';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import {
  users,
  videos,
  video_tracks,
  video_chapters,
  sites,
} from '@prisma/dashboard';
import { randomUUID } from 'crypto';
import { MediaCloudService } from '../src/mediaCloud/mediaCloud.service';
import { CDNService } from '../src/cdn/cdn.service';
import { RequestInit } from 'undici';
import { SiteVideoSettingsHStore } from '../src/sites/hstore/SiteVideoSettingsHStore';
import { GetVideosResponseDto } from '../src/videos/dto/GetVideos.dto';
import { SerializeDto } from '../src/utils/serializeDto';
import { ResCreateVideoDto } from '../src/videos/dto/ResCreateVideo.dto';

const ctx = createTestContext();

describe('Videos', () => {
  let user: users;
  let headers: { Authorization: string };
  beforeAll(async () => {
    user = await seedUser({ ctx, admin: true });

    headers = {
      Authorization: generateAuthToken(user, 'dashboard'),
    };
  });

  describe('GET /api/v1/sites/:siteId/videos', () => {
    it('returns an empty list of video objects and a "0" total count when no objects exist', async () => {
      const { site } = await seedSite({ ctx });
      await ctx.prisma.videos.deleteMany({
        where: {
          site_id: site.id,
        },
      });
      const resp = await fetch(`${ctx.host}/api/v1/sites/${site.id}/videos`, {
        headers,
      });
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(0);
      expect(body.videos.length).toEqual(0);
    });

    it('returns a list of video objects and a total count when at least one object exists', async () => {
      const { site } = await seedSite({ ctx });
      const video = await seedVideo({ ctx, site });

      const track1 = await seedVideoTrack({ ctx, video });
      const track2 = await seedVideoTrack({ ctx, video });
      const chapter1 = await seedVideoChapter({ ctx, video });
      const chatper2 = await seedVideoChapter({ ctx, video });

      const replaceIdOrSlug = (
        value: number | string | null | undefined,
        entity: 'video' | 'site' | 'track' | 'chapter',
      ) => {
        if (!value) {
          return value;
        }
        if (entity === 'site') {
          return (
            {
              [site.id]: '<site_id>',
            }[value] || value
          );
        } else if (entity === 'video') {
          return (
            {
              [video.id]: '<video_id>',
              [video.slug || 'videoslug']: '<video_slug>',
            }[value] || value
          );
        } else if (entity === 'chapter') {
          return (
            {
              [chapter1.id]: '<chapter1_id>',
              [chatper2.id]: '<chapter2_id>',
            }[value] || value
          );
        } else if (entity === 'track') {
          return (
            {
              [track1.id]: '<track1_id>',
              [track2.id]: '<track2_id>',
              [track1.slug || 'track1slug']: '<track1_slug>',
              [track2.slug || 'track2slug']: '<track2_slug>',
            }[value] || value
          );
        }
        return value;
      };

      const resp = await fetch(`${ctx.host}/api/v1/sites/${site.id}/videos`, {
        headers,
      });
      const body = (await resp.json()) as SerializeDto<GetVideosResponseDto>;
      expect(body.total_count).toBeGreaterThanOrEqual(1);
      expect(body.videos.length).toBeGreaterThanOrEqual(1);
      expect(body.videos.length).toBeGreaterThanOrEqual(body.total_count);
      expect(
        body.videos.map((video) => {
          return {
            ...video,
            id: replaceIdOrSlug(video.id, 'video'),
            site_id: replaceIdOrSlug(site.id, 'site'),
            slug: replaceIdOrSlug(video.slug, 'video'),
            created_at: normalizeDateTimeToUtc(video.created_at),
            updated_at: normalizeDateTimeToUtc(video.updated_at),
            video_chapers: {
              ...video.video_chapers,
              chapters: video.video_chapers?.chapters
                .map((chapter) => {
                  return {
                    ...chapter,
                    id: replaceIdOrSlug(chapter.id, 'chapter'),
                    created_at: normalizeDateTimeToUtc(chapter.created_at),
                    updated_at: normalizeDateTimeToUtc(chapter.updated_at),
                    video_id: replaceIdOrSlug(chapter.video_id, 'video'),
                  };
                })
                // @ts-expect-error sort to make snapshots consistent
                .sort((a, b) => (a.id > b.id ? -1 : 1)),
            },
            vtt: {
              ...video.vtt,
              tracks: video.vtt?.tracks
                .map((track) => {
                  return {
                    ...track,
                    id: replaceIdOrSlug(track.id, 'track'),
                    created_at: normalizeDateTimeToUtc(track.created_at),
                    updated_at: normalizeDateTimeToUtc(track.updated_at),
                    video_id: replaceIdOrSlug(track.video_id, 'video'),
                    slug: replaceIdOrSlug(track.slug, 'track'),
                  };
                })
                // @ts-expect-error sort to make snapshots consistent
                .sort((a, b) => (a.id > b.id ? -1 : 1)),
            },
          };
        }),
      ).toMatchSnapshot();
    });

    it('returns a search list of video objects and a total count', async () => {
      const { site } = await seedSite({ ctx });
      const videoTitle = { title: 'foobar' };
      await seedVideo({ ctx, site, video: videoTitle });
      const videoDescription = { description: 'foobar' };
      await seedVideo({ ctx, site, video: videoDescription });
      const videoKeywords = { keywords: 'foobar' };
      await seedVideo({ ctx, site, video: videoKeywords });
      const video4 = await seedVideo({ ctx, site });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?query=foobar`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(3);
      expect(body.videos).not.toContain(video4);
    });

    it('returns an empty search list of video objects and a total count', async () => {
      const { site } = await seedSite({ ctx });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?query=foobar`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(0);
      expect(body.videos).toEqual([]);
    });

    it('returns a search list of video objects and a total count', async () => {
      const { site } = await seedSite({ ctx });
      const videoTitle = { title: 'foobar' };
      await seedVideo({ ctx, site, video: videoTitle });
      const videoDescription = { description: 'foobar' };
      await seedVideo({ ctx, site, video: videoDescription });
      const videoKeywords = { keywords: 'foobar' };
      await seedVideo({ ctx, site, video: videoKeywords });
      const video4 = await seedVideo({ ctx, site });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?query=foobar`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(3);
      expect(body.videos).not.toContain(video4);
    });

    it('returns a filtered list of video objects by up_next_order and a total count', async () => {
      const { site } = await seedSite({ ctx });
      const video1 = { up_next_order: 1 };
      await seedVideo({ ctx, site, video: video1 });
      const video2 = { up_next_order: 0 };
      await seedVideo({ ctx, site, video: video2 });
      const video3 = { up_next_order: 2 };
      await seedVideo({ ctx, site, video: video3 });

      const resp1 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?priority=boosted`,
        {
          headers,
        },
      );
      const body1: GetVideosResponseDto =
        (await resp1.json()) as GetVideosResponseDto;
      expect(body1.total_count).toEqual(1);
      expect(body1.videos).not.toContain(video2);
      expect(body1.videos).not.toContain(video3);

      const resp2 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?priority=0`,
        {
          headers,
        },
      );
      const body2: GetVideosResponseDto =
        (await resp2.json()) as GetVideosResponseDto;
      expect(body2.total_count).toEqual(1);
      expect(body2.videos).not.toContain(video1);
      expect(body2.videos).not.toContain(video3);

      const resp3 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?priority=excluded`,
        {
          headers,
        },
      );
      const body3: GetVideosResponseDto =
        (await resp3.json()) as GetVideosResponseDto;
      expect(body3.total_count).toEqual(1);
      expect(body3.videos).not.toContain(video1);
      expect(body3.videos).not.toContain(video2);
    });

    it('returns a list, sorted by title, of video objects and a total count', async () => {
      const { site } = await seedSite({ ctx });
      const video1 = { title: 'AAAA' };
      await seedVideo({ ctx, site, video: video1 });
      const video2 = { title: 'BBBB' };
      await seedVideo({ ctx, site, video: video2 });
      const video3 = { title: 'CCCC' };
      await seedVideo({ ctx, site, video: video3 });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?sort=title`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(3);
      expect(body.videos[0].title).toEqual(video1.title);
      expect(body.videos[1].title).toEqual(video2.title);
      expect(body.videos[2].title).toEqual(video3.title);

      const resp2 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?sort=title&sort_order=desc`,
        {
          headers,
        },
      );
      const body2: GetVideosResponseDto =
        (await resp2.json()) as GetVideosResponseDto;
      expect(body2.total_count).toEqual(3);
      expect(body2.videos[0].title).toEqual(video3.title);
      expect(body2.videos[1].title).toEqual(video2.title);
      expect(body2.videos[2].title).toEqual(video1.title);
    });

    it('returns a list, sorted by up_next_order, of video objects and a total count', async () => {
      const { site } = await seedSite({ ctx });
      const video1 = { title: 'AAAA', up_next_order: 0 };
      await seedVideo({ ctx, site, video: video1 });
      const video2 = { title: 'BBBB', up_next_order: 1 };
      await seedVideo({ ctx, site, video: video2 });
      const video3 = { title: 'CCCC', up_next_order: 2 };
      await seedVideo({ ctx, site, video: video3 });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?sort=up_next_order`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(3);
      expect(body.videos[0].up_next_order).toEqual('standard');
      expect(body.videos[1].up_next_order).toEqual('boosted');
      expect(body.videos[2].up_next_order).toEqual('excluded');

      const resp2 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?sort=up_next_order&sort_order=desc`,
        {
          headers,
        },
      );
      const body2: GetVideosResponseDto =
        (await resp2.json()) as GetVideosResponseDto;
      expect(body2.total_count).toEqual(3);
      expect(body2.videos[0].up_next_order).toEqual('excluded');
      expect(body2.videos[1].up_next_order).toEqual('boosted');
      expect(body2.videos[2].up_next_order).toEqual('standard');
    });

    it('returns a list, sorted by created_at, of video objects and a total count', async () => {
      const { site } = await seedSite({ ctx });
      const video1 = {
        title: 'AAAA',
        created_at: new Date('1982-12-29T10:45:00+04:00'),
      };
      await seedVideo({ ctx, site, video: video1 });
      const video2 = {
        title: 'BBBB',
        created_at: new Date('1985-04-02T12:45:00+04:00'),
      };
      await seedVideo({ ctx, site, video: video2 });
      const video3 = {
        title: 'CCCC',
        created_at: new Date('2007-04-04T10:45:00+04:00'),
      };
      await seedVideo({ ctx, site, video: video3 });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?sort=created_at`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(3);
      expect(Date.parse(`${body.videos[0].created_at}`)).toEqual(
        Date.parse(`${video1.created_at}`),
      );
      expect(Date.parse(`${body.videos[1].created_at}`)).toEqual(
        Date.parse(`${video2.created_at}`),
      );
      expect(Date.parse(`${body.videos[2].created_at}`)).toEqual(
        Date.parse(`${video3.created_at}`),
      );

      const resp2 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?sort=created_at&sort_order=desc`,
        {
          headers,
        },
      );
      const body2: GetVideosResponseDto =
        (await resp2.json()) as GetVideosResponseDto;
      expect(body2.total_count).toEqual(3);
      expect(Date.parse(`${body2.videos[2].created_at}`)).toEqual(
        Date.parse(`${video1.created_at}`),
      );
      expect(Date.parse(`${body2.videos[1].created_at}`)).toEqual(
        Date.parse(`${video2.created_at}`),
      );
      expect(Date.parse(`${body2.videos[0].created_at}`)).toEqual(
        Date.parse(`${video3.created_at}`),
      );
    });

    it('returns a paginated list', async () => {
      const { site } = await seedSite({ ctx });

      for (let i = 0; i < 30; i++) {
        await seedVideo({ ctx, site });
      }

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?page=2`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(30);
      expect(body.videos.length).toEqual(5);

      const resp1 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?page=2`,
        {
          headers,
        },
      );
      const body1: GetVideosResponseDto =
        (await resp1.json()) as GetVideosResponseDto;
      expect(body1.total_count).toEqual(30);
      expect(body1.videos.length).toEqual(5);

      const resp2 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?page=3`,
        {
          headers,
        },
      );
      const body2: GetVideosResponseDto =
        (await resp2.json()) as GetVideosResponseDto;
      expect(body2.total_count).toEqual(30);
      expect(body2.videos.length).toEqual(0);
    });

    it('returns a paginated list with custom number of items per page of 10', async () => {
      const { site } = await seedSite({ ctx });

      for (let i = 0; i < 20; i++) {
        await seedVideo({ ctx, site });
      }

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?page=2&per_page=10`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(20);
      expect(body.videos.length).toEqual(10);
    });

    it('returns a paginated list with custom number of items per page of 3', async () => {
      const { site } = await seedSite({ ctx });

      for (let i = 0; i < 15; i++) {
        await seedVideo({ ctx, site });
      }

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?page=4&per_page=3`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(15);
      expect(body.videos.length).toEqual(3);
    });

    it('returns a paginated list with custom number of items per page of 1', async () => {
      const { site } = await seedSite({ ctx });

      for (let i = 0; i < 9; i++) {
        await seedVideo({ ctx, site });
      }

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?page=6&per_page=1`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(9);
      expect(body.videos.length).toEqual(1);
    });

    it('returns a list of video objects and a total count with priority of boosted', async () => {
      const { site } = await seedSite({ ctx });
      const video1 = { up_next_order: 1 };
      const vid1 = await seedVideo({ ctx, site, video: video1 });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?priority=boosted`,
        {
          headers,
        },
      );
      const body: GetVideosResponseDto =
        (await resp.json()) as GetVideosResponseDto;
      expect(body.total_count).toEqual(1);
      expect(body.videos[0].id).toEqual(vid1.id);

      const resp2 = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos?priority=1`,
        {
          headers,
        },
      );
      const body2: GetVideosResponseDto =
        (await resp2.json()) as GetVideosResponseDto;
      expect(body2.total_count).toEqual(1);
      expect(body2.videos[0].id).toEqual(vid1.id);
    });

    void testSiteUserRoleAccessV2({
      ctx,
      expectedStatuses: {
        ad_settings: 401,
        admin: 200,
        owner: 200,
        payment: 401,
        post_termination_new_owner: 401,
        reporting: 401,
        video: 200,
      },
      makeRequest: ({ user, siteId }) => {
        return fetch(`${ctx.host}/api/v1/sites/${siteId}/videos`, {
          headers: {
            Authorization: `${generateAuthToken(user)}`,
          },
        });
      },
    });
  });

  describe('GET /api/v1/sites/:siteId/videos/:id', () => {
    it('returns a video object when it exists', async () => {
      const { site } = await seedSite({ ctx });
      const video = await seedVideo({ ctx, site });
      const slug = video.slug as string;

      await seedVideoTrack({ ctx, video });
      await seedVideoTrack({ ctx, video });

      await seedVideoChapter({ ctx, video });
      await seedVideoChapter({ ctx, video });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos/${slug}`,
        {
          headers,
        },
      );

      const body: { video: ResCreateVideoDto } = (await resp.json()) as {
        video: ResCreateVideoDto;
      };

      setStaticDateTimes(body.video);
      setStaticIdFields(body.video, ['id', 'slug', 'site_id']);

      body.video.vtt.forEach((track) => {
        setStaticIdFields(track, ['id', 'video_id', 'slug']);
        setStaticDateTimes(track);
      });

      body.video.video_chapters.forEach((chapter) => {
        setStaticIdFields(chapter, ['id', 'video_id']);
        setStaticDateTimes(chapter);
      });

      expect(body).toMatchSnapshot();
    });

    it("returns a 404 when the video doesn't exist", async () => {
      const { site } = await seedSite({ ctx });
      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos/nothere`,
        {
          headers,
        },
      );

      expect(resp.status).toEqual(404);
    });

    it("returns a 400 when the site doesn't exist", async () => {
      const { site } = await seedSite({ ctx });
      const video = await seedVideo({ ctx, site });
      const resp = await fetch(
        `${ctx.host}/api/v1/sites/nothere/videos/${video.slug}`,
        {
          headers,
        },
      );

      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 404 : 400);
    });

    it("returns a 404 when the video doesn't belong to the site", async () => {
      const { site } = await seedSite({ ctx });
      const video = await seedVideo({ ctx, site });
      const { site: siteTwo } = await seedSite({ ctx });
      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${siteTwo.id}/videos/${video.slug}`,
        {
          headers,
        },
      );

      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 200 : 404);
    });

    const setupRoleTest: RoleTestFunc = async ({ site, user }) => {
      const video = await seedVideo({ ctx, site });
      const url = `${ctx.host}/api/v1/sites/${site.id}/videos/${video.slug}`;

      return { url, user };
    };

    void testSiteUserRoleAccess(setupRoleTest);
  });

  describe('POST /api/v1/sites/:siteId/videos', () => {
    const errorStatus = process.env.USE_RAILS_API ? 422 : 400;
    const makeVideoRequest = async ({
      videoPayload,
      site,
      headersOverride = {},
    }: {
      videoPayload?: VideoPayload;
      site?: sites;
      headersOverride?: Record<string, string>;
    }) => {
      const fileId = randomUUID().slice(0, 10);
      videoPayload = videoPayload || createVideoPayload({ fileId });
      site = site || (await seedSite({ ctx })).site;
      const response = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos`,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            ...headersOverride,
          },
          body: JSON.stringify(videoPayload),
        },
      );

      const bodyRaw = (await response.json()) as {
        video: videos & {
          has_unique_permalink: boolean;
          video_chapters: video_chapters[];
          vtt: video_tracks[];
        };
      };

      const body = replaceRandomIds(bodyRaw, [fileId, site.slug as string]);

      if (body.video) {
        setStaticIdFields(body.video, ['id', 'site_id', 'user_id']);
        setStaticDateTimes(body.video);
        body.video.video_chapters.forEach((chapter) => {
          setStaticIdFields(chapter, ['id', 'video_id']);
          setStaticDateTimes(chapter);
        });
        body.video.vtt.forEach((track) => {
          setStaticIdFields(track, ['id', 'video_id']);
          setStaticDateTimes(track);
        });
        body.video.video_chapters.sort((a, b) => (a.time || 0) - (b.time || 0));
        body.video.vtt.sort((a, b) => a.id - b.id);
      }

      const { status } = response;

      return { body, status, site, fileId, videoPayload };
    };
    it('returns the expected object', async () => {
      const meta: SiteVideoSettingsHStore = {
        auto_insert_offset: 10,
        disable_overlay: true,
        auto_insert_sticky_video: true,
        custom_hoist_position: 'bottom_right',
        custom_hoist_selector: 'body',
        default_video_headline: 'headline',
        default_video_headline_el: 'h1',
        default_vtt: 30,
        featured_video_allow_selector: 'body',
        featured_video_id: '1',
        featured_video_type: 'video',
        hoist_first_video: true,
        hoist_first_video_desktop: true,
        hoist_first_video_mobile: true,
        midroll_enabled: true,
        mobile_popout_placement: 'bottom_right',
        mobile_popout_top_margin: 10,
        player_aspect_ratio: '16:9',
        player_background: 'transparent',
        sticky_content_side: true,
      };

      const randomId = randomUUID().slice(0, 10);
      const { site } = await seedSite({
        ctx,
        video_settings: meta,
        siteData: {},
        randomId,
      });

      const { body } = await makeVideoRequest({ site });
      expect(body).toMatchSnapshot();
    });

    it('sets the video number', async () => {
      const { site } = await seedSite({ ctx });

      const videoNumber = Math.round(Math.random() * 10);
      /** Seed a video record with a generated video number */
      await seedVideo({
        ctx,
        video: { video_number: videoNumber },
        site,
      });
      const { body } = await makeVideoRequest({ site });
      expect(body.video.video_number).toEqual(videoNumber + 1);
    });

    const presenceValidationFields = ['title', 'keywords', 'description'];
    for (const field of presenceValidationFields) {
      it(`validates presence of ${field}`, async () => {
        const videoPayload = createVideoPayload({
          overrides: { [field]: null },
        });
        const { status } = await makeVideoRequest({ videoPayload });
        expect(status).toEqual(errorStatus);
      });
    }

    it('validates a public_id is present in field_json', async () => {
      const videoPayload = createVideoPayload({});
      videoPayload.file_json.public_id = undefined;
      const { status } = await makeVideoRequest({ videoPayload });
      expect(status).toEqual(errorStatus);
    });

    describe('temp tag removal', () => {
      let spy: jest.SpyInstance;

      beforeAll(() => {
        spy = jest.spyOn(MediaCloudService.prototype, 'removeTag');
      });

      beforeEach(() => {
        spy.mockReset();
      });

      it('removes the assets temp tag from Media Cloud Provider if a callback exists', async () => {
        if (process.env.USE_RAILS_API) {
          return;
        }
        const slug = randomUUID().slice(0, 10);
        await seedVideoCallback({ ctx, slug });
        const videoPayload = createVideoPayload({ fileId: slug });
        await makeVideoRequest({ videoPayload });
        expect(spy).toHaveBeenCalled();
      });

      it('does not remove temp tag from Cloud Provider if callback does not exist', async () => {
        if (process.env.USE_RAILS_API) {
          return;
        }
        const videoPayload = createVideoPayload({});
        await makeVideoRequest({ videoPayload });
        expect(spy).not.toHaveBeenCalled();
      });
    });

    it('soft purges the video sitemap from the CDN', async () => {
      if (process.env.USE_RAILS_API) {
        return;
      }
      const spy = jest.spyOn(CDNService.prototype, 'softPurgeKey');
      const { site } = await makeVideoRequest({});
      expect(spy).toHaveBeenCalledWith({ key: `video_sitemap/${site.id}` });
    });

    it('strips attributes of whitespace', async () => {
      const overrides = {
        description: '  untrimmedDescription  ',
        title: '   title  ',
        keywords: '   keywords  ',
      };
      const videoPayload = createVideoPayload({ overrides });
      const { body } = await makeVideoRequest({ videoPayload });
      for (const override of Object.entries(overrides)) {
        const [key, value] = override;
        expect(body.video[key as keyof videos]).toEqual(value.trim());
      }
    });

    it('checks permalink is a valid url', async () => {
      const permalink = 'notAValidUrl';
      const videoPayload = createVideoPayload({
        overrides: { permalink },
      });
      const { status } = await makeVideoRequest({ videoPayload });
      expect(status).toEqual(errorStatus);
    });

    it('validates the permalink matches the site`s domain', async () => {
      const permalink = `http://notSitesDomain.com`;
      const videoPayload = createVideoPayload({
        overrides: { permalink },
      });
      const { status } = await makeVideoRequest({ videoPayload });
      expect(status).toEqual(errorStatus);
    });

    it('checks for permalink uniqueness', async () => {
      const { site } = await seedSite({ ctx });
      const permalink = `http://${site.domain}`;
      const firstVideoPayload = createVideoPayload({
        overrides: { permalink },
      });

      await makeVideoRequest({ site, videoPayload: firstVideoPayload });

      const secondVideoPayload = createVideoPayload({
        overrides: { permalink },
      });

      const { body } = await makeVideoRequest({
        site,
        videoPayload: secondVideoPayload,
      });

      expect(body.video.has_unique_permalink).toEqual(false);
    });

    it('uses the user_id of the uploader and not the site owner', async () => {
      const siteOwner = await seedUser({ ctx });
      const anotherUser = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [
          { userId: siteOwner.id, roles: [SiteUserRole.owner] },
          { userId: anotherUser.id, roles: [SiteUserRole.video] },
        ],
      });
      const videoPayload = await createVideoPayload({});

      const response = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos`,
        {
          method: 'POST',
          headers: {
            Authorization: generateAuthToken(anotherUser, 'dashboard'),
            'content-type': 'application/json',
          },
          body: JSON.stringify(videoPayload),
        },
      );

      const body = (await response.json()) as { video: videos };
      expect(body.video.user_id).toEqual(anotherUser.id);
    });

    it('sets the video status to processing if a related video callback does not exist', async () => {
      const videoPayload = await createVideoPayload({});
      const { body } = await makeVideoRequest({ videoPayload });
      expect(body.video.status).toEqual('processing');
    });

    it('sets the video status to live if a related video callback exists', async () => {
      const slug = randomUUID().slice(0, 10);
      await seedVideoCallback({ ctx, slug });
      const videoPayload = createVideoPayload({ fileId: slug });
      const { body } = await makeVideoRequest({ videoPayload });
      expect(body.video.status).toEqual('live');
    });

    it('allows access to an mcp token', async () => {
      const headers = {
        Authorization: generateAuthToken(user, 'mcp'),
      };
      const resp = await makeVideoRequest({ headersOverride: headers });
      expect(resp.status).toEqual(201);
    });

    const setupRoleTest: RoleTestFunc = async ({ user, site }) => {
      const videoPayload = createVideoPayload({});
      const url = `${ctx.host}/api/v1/sites/${site.id}/videos`;
      const fetchParams = {
        method: 'POST',
        headers: {
          Authorization: generateAuthToken(user, 'dashboard'),
          'content-type': 'application/json',
        },
        body: JSON.stringify(videoPayload),
      };

      return { url, fetchParams };
    };

    void testSiteUserRoleAccess(setupRoleTest);
  });

  describe('PATCH /api/v1/sites/:siteId/videos/:slug/reprocess', () => {
    let adminUser: users;
    let adminHeaders: Record<string, string>;

    beforeEach(async () => {
      adminUser = await seedUser({ ctx, admin: true });

      adminHeaders = {
        Authorization: generateAuthToken(adminUser, 'dashboard'),
      };
    });

    const makeReprocessRequest = async ({
      optHeaders = {},
      site,
    }: {
      optHeaders?: Record<string, string>;
      site?: sites;
    }) => {
      site = site || (await seedSite({ ctx })).site;
      const video = await seedVideo({ ctx, site });
      const testSlug = `hetppjceg7guktdccohm`;

      /**
       * The rails app will call cloudinary in development env. So to test
       * I'm using a real slug for a random THG video. The video will be
       * reprocessed which stinks. But I don't have any ideas on how to
       * intercept the call on the Rails application without investing more
       * time than its worth. It will do no harm to reprocess this video over
       * and over while we develop this application and it can later be removed.
       */
      video.slug = testSlug;
      await ctx.prisma.videos.deleteMany({ where: { slug: testSlug } });
      await ctx.prisma.videos.update({
        where: { id: video.id },
        data: { slug: testSlug },
      });

      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/videos/${video.slug}/reprocess`,
        {
          headers: {
            ...adminHeaders,
            ...optHeaders,
          },
          method: 'PATCH',
        },
      );

      type RespType = { video: videos };
      let body: RespType;
      try {
        body = (await resp.json()) as RespType;
      } catch (e) {
        throw new Error(`Failed to parse response body: ${e}`);
      }

      return { body, video, site, status: resp.status };
    };

    it('responds with a video object', async () => {
      /** Prevent call to cloudinary */
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      captureOutboundRequest<{ public_id: string }>(
        `https://api.cloudinary.com/v1_1/mediavine/video/explicit`,
      );

      const { body } = await makeReprocessRequest({});
      if (!body || !body.video) {
        throw new Error('No body returned');
      }

      setStaticDateTimes(body.video);
      body.video.id = 100;
      body.video.site_id = 100;

      expect(body).toMatchSnapshot();
    });

    it('calls cloudinary with the correct params', async () => {
      if (process.env.USE_RAILS_API) {
        return;
      }
      const outboundRequest = captureOutboundRequest<{ public_id: string }>(
        `https://api.cloudinary.com/v1_1/mediavine/video/explicit`,
      );
      const { body, video } = await makeReprocessRequest({});
      const { url: cloudinaryUrl, body: cloudinaryBody } =
        await outboundRequest;
      if (!body || !body.video) {
        throw new Error('No body returned');
      }

      setStaticDateTimes(body.video);
      body.video.id = 100;
      body.video.site_id = 100;

      /** Cloudinary was called */
      expect(cloudinaryUrl).toMatchInlineSnapshot(
        `"https://api.cloudinary.com/v1_1/mediavine/video/explicit"`,
      );

      /** Cloudinary was called with correct identifying slug */
      expect(cloudinaryBody['public_id']).toEqual(video.slug);
    });

    const setupFunc: RoleTestFunc = async (params) => {
      const { site } = params;
      const video = await seedVideo({ ctx, site });

      /** Silently capture this request */
      // void captureOutboundRequest<{ public_id: string }>(
      //   `https://api.cloudinary.com/v1_1/mediavine/video/explicit`,
      // );
      return {
        url: `${ctx.host}/api/v1/sites/${site.id}/videos/${video.slug}/reprocess`,
        fetchParams: {
          method: 'PATCH',
        },
      };
    };
    void testSiteUserRoleAccess(setupFunc);
  });
});

type RoleTestParams = {
  role: SiteUserRole;
  user: users;
  site: sites;
};
type RoleTestFunc = (
  params: RoleTestParams,
) => Promise<{ url: string; fetchParams?: RequestInit }>;

async function testSiteUserRoleAccess(setupFunc: RoleTestFunc) {
  const siteUserRoles = Object.entries(SiteUserRole);
  for (const role of siteUserRoles) {
    const [roleName, roleValue] = role;
    if (typeof roleValue !== 'number') {
      continue;
    }

    it(`matches the snapshot for a user with the ${roleName} role`, async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [roleValue as SiteUserRole] }],
      });

      const { fetchParams, url } = await setupFunc({
        role: roleValue,
        user,
        site,
      });
      const headers = { Authorization: generateAuthToken(user) };
      const response = await fetch(url, {
        headers,
        ...fetchParams,
      });

      expect(response.status).toMatchSnapshot();
    });
  }
}

type VideoPayload = Partial<videos> & {
  video_tracks_attributes?: Partial<video_tracks>[];
  video_chapters_attributes?: Partial<video_chapters & { slug: string }>[];
  file_json: {
    file?: string;
    public_id?: string;
    duration?: number;
    height?: number;
    width?: number;
    version?: string;
  };
  image_json: {
    version?: string;
    public_id?: string;
  };
};

const createVideoPayload = ({
  overrides = {},
  fileId = randomUUID().slice(0, 10),
}: {
  overrides?: Partial<VideoPayload>;
  fileId?: string;
}): VideoPayload => ({
  description: 'description',
  image: 'image',
  keywords: 'keywords',
  status: 1,
  title: 'title',
  width: 1920,
  video_tracks_attributes: [
    {
      filetype: 'filetype',
      kind: 'kind',
      label: 'label',
      slug: 'slug',
      srclang: 'srclang',
    },
    {
      filetype: 'filetype',
      kind: 'kind',
      label: 'label',
      slug: 'slug',
      srclang: 'srclang',
    },
  ],
  video_chapters_attributes: [
    {
      description: 'description',
      time: 30,
    },
    {
      description: 'description',
      time: 45,
    },
  ],
  streaming_profile: 'video',
  up_next_order: 1,
  video_headline: 'video_headline',
  video_number: 1,
  file_json: {
    public_id: fileId,
    duration: 30,
    height: 1080,
    width: 1920,
    version: 'version',
  },
  image_json: {
    version: 'version',
    public_id: fileId,
  },
  ...overrides,
});

const setStaticDateTimes = <
  T extends {
    created_at?: Date | null;
    updated_at?: Date | null;
  },
>(
  obj: T,
): T => {
  obj.created_at && (obj.created_at = new Date('2020-01-01T00:00:00.000Z'));
  obj.updated_at && (obj.updated_at = new Date('2020-01-01T00:00:00.000Z'));

  return obj;
};

const setStaticIdFields = <T, K extends keyof T>(obj: T, ids: K[]): T => {
  ids.forEach((id) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj[id] = 100 as any;
  });

  return obj;
};
