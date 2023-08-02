import { MediaCloudService } from '../src/mediaCloud/mediaCloud.service';
import { captureOutboundRequest } from './__helpers';

describe('MediaCloud Service', () => {
  let mediaCloud: MediaCloudService;
  let configServiceMock;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configServiceMock = { get: (variable: string) => variable } as any;
    mediaCloud = new MediaCloudService(configServiceMock);
  });

  it('should call the Media Cloud Provider with the tag and id', async () => {
    const outboundRequest = captureOutboundRequest();
    await mediaCloud.removeTag('test');
    const { url, body } = await outboundRequest;

    expect(url).toMatchInlineSnapshot(
      `"https://api.cloudinary.com/v1_1/mediavine/image/tags"`,
    );

    if (typeof body !== 'object' || body === null) {
      throw new Error('body is not an object');
    }

    expect(body['public_ids[]']).toMatchInlineSnapshot(`"test"`);
    expect(body.tag).toMatchInlineSnapshot(`"temp"`);
  });

  it('calls the Media Cloud Provider for an explicit transform', async () => {
    const outboundRequest = captureOutboundRequest();
    await mediaCloud.explicitTransform('slug');
    const { url, body } = await outboundRequest;

    expect(url).toMatchInlineSnapshot(
      `"https://api.cloudinary.com/v1_1/mediavine/video/explicit"`,
    );

    /** remove dynamic props from snapshotted output */
    if (
      body !== null &&
      typeof body === 'object' &&
      body['signature'] &&
      body['timestamp']
    ) {
      delete body.signature;
      delete body.timestamp;
    }

    expect(body).toMatchInlineSnapshot(`
      {
        "api_key": "api_key",
        "eager": "sp_video_hd_h265/m3u8|sp_video_hd_vp9/mpd|sp_video_hd_h264/m3u8|sp_hd/m3u8|t_original/mp4",
        "eager_async": "1",
        "eager_notification_url": "CLOUDINARY_NOTIFICATION_URL",
        "public_id": "slug",
        "type": "upload",
      }
    `);
  });
});
