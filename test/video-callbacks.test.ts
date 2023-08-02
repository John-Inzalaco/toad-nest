import { createTestContext, seedSite, seedVideo } from './__helpers';
import {
  MediaCloudService,
  VideoCallbackPayload,
  generateCloudinarySignature,
} from '../src/mediaCloud/mediaCloud.service';
import { sites, videos } from '@prisma/dashboard';
import { randomUUID } from 'crypto';

const ctx = createTestContext();

describe('VideoCallbacks', () => {
  let tagRemoveSpy: jest.SpyInstance;

  beforeAll(() => {
    tagRemoveSpy = jest.spyOn(MediaCloudService.prototype, 'removeTag');
  });
  beforeEach(() => {
    tagRemoveSpy.mockReset();
  });

  const getPayload = (overrides = {}) => ({
    public_id: randomUUID().slice(0, 10),
    version: 1368881626,
    width: 864,
    height: 576,
    format: 'jpg',
    resource_type: 'image',
    created_at: '2013-05-18T12:53:46Z',
    bytes: 120253,
    notification_type: 'eager',
    url: 'https://res.cloudinary.com/1233456ab/image/upload/v1368881626/djhoeaqcynvogt9xzbn9.jpg',
    secure_url:
      'https://cloudinary-a.akamaihd.net/1233456ab/image/upload/v1368881626/djhoeaqcynvogt9xzbn9.jpg',
    ...overrides,
  });

  const getCloudinarySignature = (
    timestamp: number,
    payload: VideoCallbackPayload,
  ) =>
    generateCloudinarySignature({
      payload,
      headers: {
        'x-cld-timestamp': timestamp.toString(),
        'x-cld-signature': 'unused',
      },
    });

  const sendVideoCallbackRequest = async ({
    timestamp = Math.round(new Date().getTime() / 1000),
    signature = undefined,
    overrides = {},
  }: {
    timestamp?: number;
    signature?: string;
    overrides?: { [key: string]: unknown };
  }) => {
    const requestBody = getPayload(overrides);
    signature = signature || getCloudinarySignature(timestamp, requestBody);

    const resp = await fetch(`${ctx.host}/videos/callback`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'X-Cld-Signature': signature,
        'X-Cld-Timestamp': timestamp.toString(),
        'Content-Type': 'application/json',
      },
    });

    const responseBody = await resp.text();
    const status = resp.status;

    return { requestBody, responseBody, status };
  };

  it('validates the request body`s signature', async () => {
    const { responseBody } = await sendVideoCallbackRequest({
      signature: 'invalid',
    });
    expect(responseBody).toContain(`INVALID Signature`);
  });

  describe('if the video record does not exist for the slug', () => {
    it('returns `in progress message`', async () => {
      const { responseBody } = await sendVideoCallbackRequest({});
      expect(responseBody).toContain(`in progress, status: processing`);
    });

    it('creates a video callback record', async () => {
      const { requestBody } = await sendVideoCallbackRequest({});

      const callbackRecord = await ctx.prisma.video_callbacks.findFirst({
        where: { slug: requestBody.public_id },
      });

      expect(callbackRecord).toBeDefined();
      expect(callbackRecord?.slug).toEqual(requestBody.public_id);
    });

    it('does not call the mediaCloudService temp tag removal', async () => {
      if (process.env.USE_RAILS_API) {
        return;
      }
      await sendVideoCallbackRequest({});
      expect(tagRemoveSpy).not.toBeCalled();
    });
  });

  describe('when the video record exists for a slug', () => {
    let site: sites;
    let video: videos;

    beforeEach(async () => {
      site = (await seedSite({ ctx })).site;
      video = await seedVideo({
        ctx,
        site,
      });
    });

    it('removes the temp tag from Media Cloud Provider', async () => {
      if (process.env.USE_RAILS_API) {
        return;
      }
      await sendVideoCallbackRequest({
        overrides: { public_id: video.slug },
      });
      expect(tagRemoveSpy).toBeCalled();
    });

    it('does not create the video callback record', async () => {
      const { status } = await sendVideoCallbackRequest({
        overrides: { public_id: video.slug },
      });

      expect(status).toEqual(200);

      const callbackRecord = await ctx.prisma.video_callbacks.findFirst({
        where: { slug: video.slug },
      });

      expect(callbackRecord).toBeNull();
    });

    /** I have a feeling these responses aren't consumed by anything */
    it('responds with snapshot', async () => {
      const { responseBody } = await sendVideoCallbackRequest({
        overrides: { public_id: video.slug },
      });

      expect(responseBody).toMatchInlineSnapshot(
        process.env.USE_RAILS_API
          ? `"complete #{video.title}, status: live"`
          : `"complete title, status: live"`,
      );
    });

    describe('when the video is in deleted status', () => {
      beforeEach(async () => {
        video = await ctx.prisma.videos.update({
          data: {
            status: 2,
          },
          where: {
            id: video.id,
          },
        });
      });

      it('responses with snapshot', async () => {
        const { responseBody } = await sendVideoCallbackRequest({
          overrides: { public_id: video.slug },
        });

        expect(responseBody).toContain(`will not process, status: deleted`);
      });

      it('does not call the media cloud provider', async () => {
        if (process.env.USE_RAILS_API) {
          return;
        }

        await sendVideoCallbackRequest({});
        expect(tagRemoveSpy).not.toBeCalled();
      });

      it('does not create a video callback record', async () => {
        const { status } = await sendVideoCallbackRequest({
          overrides: { public_id: video.slug },
        });
        expect(status).toEqual(200);

        const callbackRecord = await ctx.prisma.video_callbacks.findFirst({
          where: { slug: video.slug },
        });

        expect(callbackRecord).toBeNull();
      });
    });
  });

  describe('when the notification_type is NOT "eager"', () => {
    it('does not create the video callback record', async () => {
      const { requestBody, status } = await sendVideoCallbackRequest({
        overrides: {
          notification_type: 'not-eager',
        },
      });

      expect(status).toEqual(200);

      const callbackRecord = await ctx.prisma.video_callbacks.findFirst({
        where: { slug: requestBody.public_id },
      });

      expect(callbackRecord).toBe(null);
    });

    it('does not call the media cloud provider', async () => {
      if (process.env.USE_RAILS_API) {
        return;
      }

      await sendVideoCallbackRequest({});
      expect(tagRemoveSpy).not.toBeCalled();
    });
  });
});
